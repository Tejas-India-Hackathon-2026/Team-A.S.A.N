import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    getOwnedAttachments: vi.fn(),
    createComplaint: vi.fn(),
    linkAttachmentsToComplaint: vi.fn(),
    addComplaintActivity: vi.fn(),
    getComplaintDetail: vi.fn(),
    getApplicantDetails: vi.fn(),
    getUserProfile: vi.fn(() => Promise.resolve({ role: "student", staffApprovalStatus: "not_required" })),
    updateComplaintStatus: vi.fn(),
    createNotification: vi.fn(),
  },
  storage: { storageGetSignedUrl: vi.fn(), storagePut: vi.fn() },
  notifyOwner: vi.fn(() => Promise.resolve(undefined)),
}));
const { db, storage, notifyOwner } = mocks;

vi.mock("./db", () => mocks.db);
vi.mock("./storage", () => mocks.storage);
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { complaintsAdminRouter, complaintsRouter } from "./routers/complaints";

const createdAt = new Date("2026-08-18T12:00:00.000Z");
const baseComplaint = {
  id: 42,
  complaintId: "CF-ABCD123456",
  userId: 7,
  description: "A sparking wall outlet in the study room needs immediate inspection.",
  hostel: "C.V Raman Bhawan",
  block: "B",
  room: "204",
  departmentCategory: "Electrical",
  priorityLevel: "High" as const,
  aiSummary: "A sparking outlet in C.V Raman Bhawan requires urgent electrical inspection.",
  status: "Pending" as const,
  createdAt,
  updatedAt: createdAt,
};

function context(role: "user" | "admin" = "user") {
  return {
    user: { id: 7, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, createdAt, updatedAt: createdAt, lastSignedIn: createdAt },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn() },
  } as any;
}

describe("CampusFix complaint workflow", () => {
  it("creates a ticket, links owned evidence, and records a submission activity", async () => {
    db.getOwnedAttachments.mockResolvedValue([]);
    db.createComplaint.mockResolvedValue(baseComplaint);
    db.linkAttachmentsToComplaint.mockResolvedValue(undefined);
    db.addComplaintActivity.mockResolvedValue(undefined);

    const caller = complaintsRouter.createCaller(context());
    const result = await caller.submit({
      description: baseComplaint.description,
      hostel: baseComplaint.hostel,
      block: baseComplaint.block,
      room: baseComplaint.room,
      attachmentIds: [],
      analysis: { departmentCategory: "Electrical", priorityLevel: "High", aiSummary: baseComplaint.aiSummary },
    });

    expect(result).toEqual(baseComplaint);
    expect(db.createComplaint).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, complaintId: expect.stringMatching(/^CF-[A-Z0-9_-]{10}$/), departmentCategory: "Electrical", priorityLevel: "High" }));
    expect(db.linkAttachmentsToComplaint).toHaveBeenCalledWith(7, 42, []);
    expect(db.addComplaintActivity).toHaveBeenCalledWith(expect.objectContaining({ complaintId: 42, actorUserId: 7, eventType: "submitted" }));
  });

  it("denies ticket access to a user who did not submit it", async () => {
    db.getComplaintDetail.mockResolvedValue({ complaint: { ...baseComplaint, userId: 99 }, attachments: [], activity: [] });
    const caller = complaintsRouter.createCaller(context());
    await expect(caller.detail({ complaintId: 42 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("includes the applicant's registered details only for an administrator", async () => {
    db.getComplaintDetail.mockResolvedValue({ complaint: baseComplaint, attachments: [], activity: [] });
    db.getApplicantDetails.mockResolvedValue({ name: "Test Student", email: "student@example.com", role: "student", hostel: "C.V Raman Bhawan", gender: "Male", mobileNumber: "+919876543210", rollNumber: "24CSE101", registrationNumber: "REG/2026/001" });
    const caller = complaintsAdminRouter.createCaller(context("admin"));

    const result = await caller.detail({ complaintId: 42 });

    expect(result.applicant).toMatchObject({ name: "Test Student", rollNumber: "24CSE101", registrationNumber: "REG/2026/001" });
    expect(db.getApplicantDetails).toHaveBeenCalledWith(7);
  });

  it("omits applicant profile details from a student's own ticket view", async () => {
    db.getComplaintDetail.mockResolvedValue({ complaint: baseComplaint, attachments: [], activity: [] });
    db.getApplicantDetails.mockClear();
    const caller = complaintsRouter.createCaller(context());

    const result = await caller.detail({ complaintId: 42 });

    expect(result.applicant).toBeNull();
    expect(db.getApplicantDetails).not.toHaveBeenCalled();
  });

  it("prevents a student from changing a complaint status", async () => {
    const caller = complaintsAdminRouter.createCaller(context("user"));
    await expect(caller.updateStatus({ complaintId: 42, status: "In Progress" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updates ticket status and creates a submitter notification", async () => {
    db.getComplaintDetail.mockResolvedValue({ complaint: baseComplaint, attachments: [], activity: [] });
    db.updateComplaintStatus.mockResolvedValue({ ...baseComplaint, status: "Checked In" });
    db.addComplaintActivity.mockResolvedValue(undefined);
    db.createNotification.mockResolvedValue(undefined);
    const caller = complaintsAdminRouter.createCaller(context("admin"));

    const result = await caller.updateStatus({ complaintId: 42, status: "Checked In", note: "The department in-charge reviewed this complaint." });

    expect(result.status).toBe("Checked In");
    expect(db.addComplaintActivity).toHaveBeenCalledWith(expect.objectContaining({ complaintId: 42, actorUserId: 7, eventType: "status_changed", message: "Checked In: The department in-charge reviewed this complaint." }));
    expect(db.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, complaintId: 42, title: "Ticket CF-ABCD123456 is now Checked In" }));
  });

  it("rejects skipping a complaint workflow stage", async () => {
    db.getComplaintDetail.mockResolvedValue({ complaint: baseComplaint, attachments: [], activity: [] });
    const caller = complaintsAdminRouter.createCaller(context("admin"));

    await expect(caller.updateStatus({ complaintId: 42, status: "Resolved" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an uploaded file whose bytes do not match its MIME type", async () => {
    const caller = complaintsRouter.createCaller(context());

    await expect(caller.uploadEvidence({
      kind: "photo",
      fileName: "photo.png",
      mimeType: "image/png",
      base64Data: "data:image/png;base64,SGVsbG8=",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storage.storagePut).not.toHaveBeenCalled();
  });
});
