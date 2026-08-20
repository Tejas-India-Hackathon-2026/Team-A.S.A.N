import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { z } from "zod";
import { hostelOptions } from "@shared/hostels";
import { complaintCategoryNames, type ComplaintCategoryName } from "@shared/complaintCategories";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

const mobileNumberSchema = z.union([
  z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid mobile number."),
  z.literal(""),
  z.null(),
]).optional();

const studentIdentifierSchema = z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9/._-]*$/, "Use letters, numbers, dots, slashes, hyphens, or underscores only.");
const studentIdentifierValueSchema = z.union([studentIdentifierSchema, z.literal(""), z.null()]).optional();
const staffPhotoSchema = z.object({
  fileName: z.string().trim().min(1).max(160).regex(/^[^\\/:*?"<>|]+$/, "Use a safe photo file name."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64Data: z.string().min(1).max(5_500_000),
}).optional();
const staffWorkingFieldsSchema = z.array(z.enum(complaintCategoryNames)).min(1, "Select at least one working field.").max(complaintCategoryNames.length).optional();

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  hostel: z.enum(hostelOptions),
  gender: z.enum(["Female", "Male", "Non-binary", "Prefer not to say"]),
  role: z.enum(["student", "staff"]).optional(),
  mobileNumber: mobileNumberSchema,
  rollNumber: studentIdentifierValueSchema,
  registrationNumber: studentIdentifierValueSchema,
  staffPhoto: staffPhotoSchema,
  staffWorkingFields: staffWorkingFieldsSchema,
}).superRefine((profile, ctx) => {
  const mobileRequired = (profile.role ?? "student") === "student" && profile.gender !== "Female";
  const studentProfile = (profile.role ?? "student") === "student";
  if (mobileRequired && !profile.mobileNumber) {
    ctx.addIssue({ code: "custom", path: ["mobileNumber"], message: "Mobile number is required for this student profile." });
  }
  if (studentProfile && !profile.rollNumber) {
    ctx.addIssue({ code: "custom", path: ["rollNumber"], message: "Roll number is required for this student profile." });
  }
  if (studentProfile && !profile.registrationNumber) {
    ctx.addIssue({ code: "custom", path: ["registrationNumber"], message: "Registration number is required for this student profile." });
  }
  if (!studentProfile && !profile.staffWorkingFields?.length) {
    ctx.addIssue({ code: "custom", path: ["staffWorkingFields"], message: "Select at least one working field for this staff profile." });
  }
});

function decodeStaffPhoto(data: string) {
  const raw = data.includes(",") ? data.slice(data.indexOf(",") + 1) : data;
  if (!raw || !/^[A-Za-z0-9+/=\r\n]+$/.test(raw)) throw new TRPCError({ code: "BAD_REQUEST", message: "The staff photo could not be read." });
  return Buffer.from(raw, "base64");
}

function withoutStaffPhotoKey<T extends { staffPhotoKey?: string | null }>(profile: T) {
  const { staffPhotoKey: _staffPhotoKey, ...safeProfile } = profile;
  return safeProfile;
}

function withWorkingFields<T extends { staffWorkingFields?: string | null }>(profile: T): Omit<T, "staffWorkingFields"> & { staffWorkingFields: ComplaintCategoryName[] } {
  const { staffWorkingFields: serializedWorkingFields, ...safeProfile } = profile;
  let staffWorkingFields: ComplaintCategoryName[] = [];
  try {
    const parsed = JSON.parse(serializedWorkingFields ?? "[]");
    const checked = z.array(z.enum(complaintCategoryNames)).safeParse(parsed);
    staffWorkingFields = checked.success ? checked.data : [];
  } catch {
    staffWorkingFields = [];
  }
  return { ...safeProfile, staffWorkingFields };
}

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.getUserProfile(ctx.user.id);
    return profile ? { ...withWorkingFields(withoutStaffPhotoKey(profile)), name: ctx.user.name ?? "" } : null;
  }),
  update: protectedProcedure.input(profileSchema).mutation(async ({ ctx, input }) => {
    const existingProfile = await db.getUserProfile(ctx.user.id);
    if (input.role === "staff" && !input.staffPhoto && !existingProfile?.staffPhotoKey) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A staff photo is required for registration approval." });
    }
    let uploadedStaffPhotoKey: string | undefined;
    if (input.role === "staff" && input.staffPhoto) {
      const buffer = decodeStaffPhoto(input.staffPhoto.base64Data);
      if (!buffer.byteLength || buffer.byteLength > 3_500_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Staff photos must be smaller than 3.5 MB." });
      const stored = await storagePut(`campusfix/${ctx.user.id}/staff-profile/${Date.now()}-${input.staffPhoto.fileName}`, buffer, input.staffPhoto.mimeType);
      uploadedStaffPhotoKey = stored.key;
    }
    const staffApprovalStatus = input.role === "staff"
      ? (existingProfile?.role === "staff" && existingProfile.staffApprovalStatus !== "not_required" ? existingProfile.staffApprovalStatus : "pending")
      : "not_required";
    const profile = await db.updateUserProfile(ctx.user.id, {
      name: input.name,
      hostel: input.hostel,
      gender: input.gender,
      role: input.role,
      mobileNumber: input.mobileNumber || null,
      rollNumber: input.rollNumber || null,
      registrationNumber: input.registrationNumber || null,
      staffApprovalStatus,
      ...(input.role === "staff" && uploadedStaffPhotoKey !== undefined ? { staffPhotoKey: uploadedStaffPhotoKey } : input.role === "student" ? { staffPhotoKey: null } : {}),
      ...(input.role === "staff" ? { staffWorkingFields: JSON.stringify(input.staffWorkingFields ?? []) } : { staffWorkingFields: null }),
    });
    return { ...withWorkingFields(withoutStaffPhotoKey(profile)), name: input.name };
  }),
});
