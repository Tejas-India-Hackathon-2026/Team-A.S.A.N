import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { profileRouter } from "./routers/profile";

const createdAt = new Date("2026-08-18T12:00:00.000Z");
const studentIdentifiers = { rollNumber: "24CSE101", registrationNumber: "REG/2026/001" };

function context() {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "admin" as const,
      createdAt,
      updatedAt: createdAt,
      lastSignedIn: createdAt,
    },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn() },
  } as any;
}

describe("profile.me query contract", () => {
  it("returns null rather than undefined when an authenticated user has not created a profile", async () => {
    mocks.getUserProfile.mockResolvedValue(null);
    const caller = profileRouter.createCaller(context());
    await expect(caller.me()).resolves.toBeNull();
  });

  it("returns the authenticated name together with a completed profile for profile editing", async () => {
    mocks.getUserProfile.mockResolvedValue({ id: 1, userId: 1, role: "student", hostel: "C.V Raman Bhawan", gender: "Female", mobileNumber: null, ...studentIdentifiers });
    const caller = profileRouter.createCaller(context());
    await expect(caller.me()).resolves.toMatchObject({ name: "Test User", hostel: "C.V Raman Bhawan", gender: "Female", ...studentIdentifiers });
  });

  it("allows a female student profile without a mobile number", async () => {
    mocks.updateUserProfile.mockResolvedValue({ id: 1, userId: 1, role: "student", hostel: "C.V Raman Bhawan", gender: "Female", mobileNumber: null, ...studentIdentifiers });
    const caller = profileRouter.createCaller(context());
    await expect(caller.update({ name: "Updated Student", hostel: "C.V Raman Bhawan", gender: "Female", role: "student", mobileNumber: null, ...studentIdentifiers })).resolves.toMatchObject({ name: "Updated Student", mobileNumber: null, ...studentIdentifiers });
  });

  it("requires a mobile number for non-female student profiles", async () => {
    const caller = profileRouter.createCaller(context());
    await expect(caller.update({ name: "Test User", hostel: "C.V Raman Bhawan", gender: "Male", role: "student", mobileNumber: null, ...studentIdentifiers })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires roll and registration numbers for student profiles", async () => {
    const caller = profileRouter.createCaller(context());
    await expect(caller.update({ name: "Test User", hostel: "C.V Raman Bhawan", gender: "Female", role: "student", mobileNumber: null, rollNumber: "", registrationNumber: studentIdentifiers.registrationNumber })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.update({ name: "Test User", hostel: "C.V Raman Bhawan", gender: "Female", role: "student", mobileNumber: null, rollNumber: studentIdentifiers.rollNumber, registrationNumber: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates staff registrations in a pending approval state and persists multiple working fields with the private photo key", async () => {
    mocks.getUserProfile.mockResolvedValue(null);
    mocks.storagePut.mockResolvedValue({ key: "campusfix/1/staff-profile/photo.jpg", url: "https://storage.example/photo.jpg" });
    mocks.updateUserProfile.mockResolvedValue({ id: 1, userId: 1, role: "staff", hostel: "Aryabhatta Bhawan", gender: "Female", mobileNumber: null, rollNumber: null, registrationNumber: null, staffApprovalStatus: "pending", staffPhotoKey: "campusfix/1/staff-profile/photo.jpg", staffWorkingFields: '["Electrical","Plumbing"]' });
    const caller = profileRouter.createCaller(context());

    await expect(caller.update({ name: "Staff Member", hostel: "Aryabhatta Bhawan", gender: "Female", role: "staff", mobileNumber: null, rollNumber: null, registrationNumber: null, staffWorkingFields: ["Electrical", "Plumbing"], staffPhoto: { fileName: "staff.jpg", mimeType: "image/jpeg", base64Data: "aGVsbG8=" } })).resolves.toMatchObject({ role: "staff", staffApprovalStatus: "pending", staffWorkingFields: ["Electrical", "Plumbing"] });
    expect(mocks.storagePut).toHaveBeenCalledOnce();
    expect(mocks.updateUserProfile).toHaveBeenLastCalledWith(1, expect.objectContaining({ role: "staff", staffApprovalStatus: "pending", staffPhotoKey: "campusfix/1/staff-profile/photo.jpg", staffWorkingFields: '["Electrical","Plumbing"]' }));
  });

  it("requires a photo for first-time staff registrations while keeping student registration photo-free", async () => {
    mocks.getUserProfile.mockResolvedValue(null);
    const caller = profileRouter.createCaller(context());
    await expect(caller.update({ name: "Staff Member", hostel: "Aryabhatta Bhawan", gender: "Female", role: "staff", mobileNumber: null, rollNumber: null, registrationNumber: null, staffWorkingFields: ["Electrical"] })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("photo") });
  });

  it("requires one or more approved working fields for staff registrations", async () => {
    mocks.getUserProfile.mockResolvedValue(null);
    const caller = profileRouter.createCaller(context());
    const photo = { fileName: "staff.jpg", mimeType: "image/jpeg" as const, base64Data: "aGVsbG8=" };

    await expect(caller.update({ name: "Staff Member", hostel: "Aryabhatta Bhawan", gender: "Female", role: "staff", mobileNumber: null, rollNumber: null, registrationNumber: null, staffWorkingFields: [], staffPhoto: photo })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.update({ name: "Staff Member", hostel: "Aryabhatta Bhawan", gender: "Female", role: "staff", mobileNumber: null, rollNumber: null, registrationNumber: null, staffWorkingFields: ["Laboratory" as "Electrical"], staffPhoto: photo })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
