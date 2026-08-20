import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { complaintStatusValues, priorityValues } from "../../drizzle/schema";
import { hostelOptions } from "@shared/hostels";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
import { assertStaffApproved } from "../staffAccess";

const attachmentIdsSchema = z.array(z.number().int().positive()).max(2).default([]);
export const complaintAnalysisSchema = z.object({
  departmentCategory: z.string().trim().min(2).max(96),
  priorityLevel: z.enum(priorityValues),
  aiSummary: z.string().trim().min(8).max(480),
}).strict();

export const reportSchema = z.object({
  description: z.string().trim().min(12).max(4000),
  hostel: z.enum(hostelOptions),
  block: z.string().trim().min(1).max(64),
  room: z.string().trim().min(1).max(64),
  preferredCategory: z.string().trim().min(2).max(96).optional(),
  attachmentIds: attachmentIdsSchema,
});

function assertOwnedAttachments(found: Array<{ id: number }>, requested: number[]) {
  if (found.length !== requested.length) {
    throw new TRPCError({ code: "FORBIDDEN", message: "One or more uploaded files are unavailable for this complaint." });
  }
}

function decodeBase64(data: string) {
  const raw = data.includes(",") ? data.slice(data.indexOf(",") + 1) : data;
  if (!raw || !/^[A-Za-z0-9+/=\r\n]+$/.test(raw)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file could not be read." });
  }
  return Buffer.from(raw, "base64");
}

function assertFileSignature(buffer: Buffer, mimeType: string) {
  const signatures: Record<string, boolean> = {
    "image/jpeg": buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    "image/png": buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
    "application/pdf": buffer.toString("ascii", 0, 4) === "%PDF",
  };
  if (!signatures[mimeType]) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file type does not match its content." });
  }
}

async function requireComplaintAccess(userId: number, role: string, complaintId: number) {
  const detail = await db.getComplaintDetail(complaintId);
  if (!detail) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." });
  if (role !== "admin" && detail.complaint.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this complaint." });
  }
  const applicant = role === "admin" ? await db.getApplicantDetails(detail.complaint.userId) : null;
  return {
    ...detail,
    applicant,
    attachments: await Promise.all(detail.attachments.map(async attachment => ({
      ...attachment,
      storageUrl: await storageGetSignedUrl(attachment.storageKey),
    }))),
  };
}

export function createComplaintId() {
  return `CF-${nanoid(10).toUpperCase()}`;
}

const nextComplaintStatus: Record<(typeof complaintStatusValues)[number], (typeof complaintStatusValues)[number] | null> = {
  Pending: "Checked In",
  "Checked In": "In Progress",
  "In Progress": "Resolved",
  Resolved: null,
};

const approvedComplaintProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await assertStaffApproved(ctx.user.id);
  return next({ ctx });
});

export const complaintsRouter = router({
  uploadEvidence: approvedComplaintProcedure
    .input(z.object({
      kind: z.enum(["photo", "application"]),
      fileName: z.string().trim().min(1).max(160).regex(/^[^\\/:*?"<>|]+$/, "Use a safe file name."),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
      base64Data: z.string().min(1).max(11_000_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const isPhoto = input.kind === "photo";
      if (isPhoto && !input.mimeType.startsWith("image/")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Problem photos must be JPEG, PNG, or WebP images." });
      }
      if (!isPhoto && input.mimeType !== "application/pdf" && !input.mimeType.startsWith("image/")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Applications must be uploaded as PDF, JPEG, PNG, or WebP files." });
      }
      const buffer = decodeBase64(input.base64Data);
      if (!buffer.byteLength || buffer.byteLength > 7_500_000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Each file must be smaller than 7.5 MB." });
      }
      assertFileSignature(buffer, input.mimeType);
      const path = `campusfix/${ctx.user.id}/pending/${nanoid(12)}-${input.fileName}`;
      const stored = await storagePut(path, buffer, input.mimeType);
      return db.createPendingAttachment({
        userId: ctx.user.id,
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType,
        storageKey: stored.key,
        storageUrl: stored.url,
        fileSize: buffer.byteLength,
      });
    }),

  analyze: approvedComplaintProcedure
    .input(reportSchema)
    .mutation(async ({ ctx, input }) => {
      const attachments = await db.getOwnedAttachments(ctx.user.id, input.attachmentIds);
      assertOwnedAttachments(attachments, input.attachmentIds);
      const evidence = await Promise.all(attachments.map(async attachment => ({
        attachment,
        url: await storageGetSignedUrl(attachment.storageKey),
      })));

      const content = [
        {
          type: "text" as const,
          text: `Complaint description: ${input.description}\nLocation: Hostel ${input.hostel}, Block ${input.block}, Room ${input.room}.\nCategory chosen by the submitter: ${input.preferredCategory ?? "No preference provided"}.`,
        },
        ...evidence.map(({ attachment, url }) => attachment.mimeType.startsWith("image/")
          ? ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })
          : ({ type: "file_url" as const, file_url: { url, mime_type: "application/pdf" as const } })),
      ];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are CampusFix's complaint-routing assistant. Assess the report and attached evidence. Use the submitter's chosen category as useful context, but correct it if the evidence indicates a better route. Assign one concise department category from: Electrical, Plumbing, Housekeeping, Civil Maintenance, IT Services, Security, Internet & Wi-Fi, Furniture & Fixtures, Water Supply, Pest Control, Waste Management, or Grounds & Facilities. Priority must reflect urgency and safety risk. Keep the summary neutral, factual, and under 60 words.",
          },
          { role: "user", content },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "campusfix_complaint_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                departmentCategory: { type: "string" },
                priorityLevel: { type: "string", enum: ["Low", "Medium", "High"] },
                aiSummary: { type: "string" },
              },
              required: ["departmentCategory", "priorityLevel", "aiSummary"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response.choices[0]?.message?.content;
      if (typeof raw !== "string") throw new TRPCError({ code: "BAD_GATEWAY", message: "AI analysis returned an invalid response." });
      try {
        return complaintAnalysisSchema.parse(JSON.parse(raw));
      } catch {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "AI analysis could not be validated. Please try again." });
      }
    }),

  submit: approvedComplaintProcedure
    .input(reportSchema.extend({ analysis: complaintAnalysisSchema }))
    .mutation(async ({ ctx, input }) => {
      const attachments = await db.getOwnedAttachments(ctx.user.id, input.attachmentIds);
      assertOwnedAttachments(attachments, input.attachmentIds);
      const complaint = await db.createComplaint({
        complaintId: createComplaintId(),
        userId: ctx.user.id,
        description: input.description,
        hostel: input.hostel,
        block: input.block,
        room: input.room,
        ...input.analysis,
      });
      await db.linkAttachmentsToComplaint(ctx.user.id, complaint.id, input.attachmentIds);
      await db.addComplaintActivity({
        complaintId: complaint.id,
        actorUserId: ctx.user.id,
        eventType: "submitted",
        message: "Complaint submitted and routed for review.",
      });
      void notifyOwner({
        title: `New CampusFix complaint: ${complaint.complaintId}`,
        content: `${complaint.departmentCategory} · ${complaint.priorityLevel} priority · ${complaint.status}`,
      }).catch(() => undefined);
      return complaint;
    }),

  mine: approvedComplaintProcedure.query(({ ctx }) => db.getComplaintsForUser(ctx.user.id)),

  detail: approvedComplaintProcedure
    .input(z.object({ complaintId: z.number().int().positive() }))
    .query(({ ctx, input }) => requireComplaintAccess(ctx.user.id, ctx.user.role, input.complaintId)),
});

export const complaintsAdminRouter = router({
  list: adminProcedure
    .input(z.object({
      departmentCategory: z.string().trim().min(2).max(96).optional(),
      priorityLevel: z.enum(priorityValues).optional(),
      status: z.enum(complaintStatusValues).optional(),
    }).default({}))
    .query(({ input }) => db.listAdminComplaints(input)),

  detail: adminProcedure
    .input(z.object({ complaintId: z.number().int().positive() }))
    .query(({ ctx, input }) => requireComplaintAccess(ctx.user.id, ctx.user.role, input.complaintId)),

  updateStatus: adminProcedure
    .input(z.object({
      complaintId: z.number().int().positive(),
      status: z.enum(complaintStatusValues),
      note: z.string().trim().max(360).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getComplaintDetail(input.complaintId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." });
      if (existing.complaint.status !== input.status && nextComplaintStatus[existing.complaint.status] !== input.status) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `A complaint must move from ${existing.complaint.status} to ${nextComplaintStatus[existing.complaint.status] ?? "no further status"}.` });
      }
      const complaint = await db.updateComplaintStatus(input.complaintId, input.status);
      if (!complaint) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." });
      const message = `${input.status}: ${input.note || "Status updated."}`;
      await Promise.all([
        db.addComplaintActivity({ complaintId: complaint.id, actorUserId: ctx.user.id, eventType: "status_changed", message }),
        db.createNotification({
          userId: complaint.userId,
          complaintId: complaint.id,
          title: `Ticket ${complaint.complaintId} is now ${input.status}`,
          message,
        }),
      ]);
      void notifyOwner({
        title: `CampusFix ticket updated: ${complaint.complaintId}`,
        content: `${complaint.status} · ${complaint.departmentCategory}`,
      }).catch(() => undefined);
      return complaint;
    }),
});
