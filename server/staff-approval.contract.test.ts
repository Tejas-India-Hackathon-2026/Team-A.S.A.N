import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPendingStaffProfiles: vi.fn(),
  getUserProfile: vi.fn(),
  updateStaffApprovalStatus: vi.fn(),
  createNotification: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

vi.mock("./db", () => ({
  getPendingStaffProfiles: mocks.getPendingStaffProfiles,
  getUserProfile: mocks.getUserProfile,
  updateStaffApprovalStatus: mocks.updateStaffApprovalStatus,
  createNotification: mocks.createNotification,
}));
vi.mock("./storage", () => ({ storageGetSignedUrl: mocks.storageGetSignedUrl }));

import { staffApprovalRouter } from "./routers/staffApproval";

const createdAt = new Date("2026-08-19T12:00:00.000Z");
function context(role: "user" | "admin" = "user") { return { user: { id: 9, openId: "test", name: "Admin", email: "admin@example.com", loginMethod: "email", role, createdAt, updatedAt: createdAt, lastSignedIn: createdAt }, req: { protocol: "https", headers: {} }, res: { clearCookie: vi.fn() } } as any; }

describe("CampusFix staff approval administration", () => {
  it("returns pending staff with a signed photo URL only to administrators", async () => {
    mocks.getPendingStaffProfiles.mockResolvedValue([{ userId: 12, name: "Staff Member", email: "staff@example.com", hostel: "Vaishali Bhawan", gender: "Female", mobileNumber: null, staffPhotoKey: "private/photo.jpg", staffWorkingFields: '["Electrical","Pest Control"]', createdAt }]);
    mocks.storageGetSignedUrl.mockResolvedValue("https://signed.example/photo.jpg");
    await expect(staffApprovalRouter.createCaller(context("admin")).pending()).resolves.toEqual([expect.objectContaining({ userId: 12, staffPhotoUrl: "https://signed.example/photo.jpg", staffWorkingFields: ["Electrical", "Pest Control"] })]);
    await expect(staffApprovalRouter.createCaller(context()).pending()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to approve a pending staff registration", async () => {
    mocks.getUserProfile.mockResolvedValue({ userId: 12, role: "staff", staffApprovalStatus: "pending" });
    mocks.updateStaffApprovalStatus.mockResolvedValue({ userId: 12, staffApprovalStatus: "approved" });
    await expect(staffApprovalRouter.createCaller(context("admin")).decide({ userId: 12, decision: "approved" })).resolves.toEqual({ userId: 12, staffApprovalStatus: "approved" });
    expect(mocks.updateStaffApprovalStatus).toHaveBeenCalledWith(12, "approved");
    expect(mocks.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 12, title: "Staff registration approved" }));
  });

  it("refuses decisions for staff registrations that are not pending", async () => {
    mocks.getUserProfile.mockResolvedValue({ userId: 12, role: "staff", staffApprovalStatus: "approved" });
    await expect(staffApprovalRouter.createCaller(context("admin")).decide({ userId: 12, decision: "rejected" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
