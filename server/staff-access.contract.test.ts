import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUserProfile: vi.fn() }));
vi.mock("./db", () => mocks);

import { assertStaffApproved } from "./staffAccess";

describe("pending staff workspace restrictions", () => {
  it("blocks pending and rejected staff from complaint procedures", async () => {
    mocks.getUserProfile.mockResolvedValueOnce({ role: "staff", staffApprovalStatus: "pending" });
    await expect(assertStaffApproved(5)).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("awaiting") });
    mocks.getUserProfile.mockResolvedValueOnce({ role: "staff", staffApprovalStatus: "rejected" });
    await expect(assertStaffApproved(5)).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("not approved") });
  });

  it("permits approved staff and non-staff accounts", async () => {
    mocks.getUserProfile.mockResolvedValueOnce({ role: "staff", staffApprovalStatus: "approved" });
    await expect(assertStaffApproved(5)).resolves.toBeUndefined();
    mocks.getUserProfile.mockResolvedValueOnce({ role: "student", staffApprovalStatus: "not_required" });
    await expect(assertStaffApproved(6)).resolves.toBeUndefined();
  });
});
