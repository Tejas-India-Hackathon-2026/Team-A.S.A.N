import { TRPCError } from "@trpc/server";
import * as db from "./db";

export async function assertStaffApproved(userId: number) {
  const profile = await db.getUserProfile(userId);
  if (profile?.role !== "staff" || profile.staffApprovalStatus === "approved") return;
  const message = profile.staffApprovalStatus === "rejected"
    ? "Your staff registration was not approved. Please contact a CampusFix administrator."
    : "Your staff registration is awaiting administrator approval.";
  throw new TRPCError({ code: "FORBIDDEN", message });
}
