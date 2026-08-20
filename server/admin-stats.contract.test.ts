import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ db: { getRegisteredUserStats: vi.fn() } }));
vi.mock("./db", () => mocks.db);

import { adminStatsRouter } from "./routers/adminStats";

const createdAt = new Date("2026-08-19T12:00:00.000Z");

function context(role: "user" | "admin" = "user") {
  return {
    user: { id: 7, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, createdAt, updatedAt: createdAt, lastSignedIn: createdAt },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn() },
  } as any;
}

describe("CampusFix registered-user administration stats", () => {
  it("returns the total completed registrations with a student and staff breakdown to an administrator", async () => {
    mocks.db.getRegisteredUserStats.mockResolvedValue({ total: 12, students: 10, staff: 2 });
    const caller = adminStatsRouter.createCaller(context("admin"));

    await expect(caller.registeredUsers()).resolves.toEqual({ total: 12, students: 10, staff: 2 });
    expect(mocks.db.getRegisteredUserStats).toHaveBeenCalledOnce();
  });

  it("does not expose registration statistics to non-administrator accounts", async () => {
    const caller = adminStatsRouter.createCaller(context("user"));
    await expect(caller.registeredUsers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
