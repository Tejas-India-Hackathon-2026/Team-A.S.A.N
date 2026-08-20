import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storageGetSignedUrl } from "../storage";

export const staffApprovalRouter = router({
  pending: adminProcedure.query(async () => {
    const profiles = await db.getPendingStaffProfiles();
    return Promise.all(profiles.map(async profile => ({
      ...profile,
      staffWorkingFields: profile.staffWorkingFields ? JSON.parse(profile.staffWorkingFields) as string[] : [],
      staffPhotoUrl: profile.staffPhotoKey ? await storageGetSignedUrl(profile.staffPhotoKey) : null,
    })));
  }),
  decide: adminProcedure.input(z.object({
    userId: z.number().int().positive(),
    decision: z.enum(["approved", "rejected"]),
  })).mutation(async ({ input }) => {
    const profile = await db.getUserProfile(input.userId);
    if (!profile || profile.role !== "staff" || profile.staffApprovalStatus !== "pending") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Pending staff registration not found." });
    }
    const updated = await db.updateStaffApprovalStatus(input.userId, input.decision);
    await db.createNotification({
      userId: input.userId,
      title: `Staff registration ${input.decision}`,
      message: input.decision === "approved"
        ? "Your staff account has been approved. You can now access the CampusFix workspace."
        : "Your staff account registration was rejected. Please review your details and contact the administrator.",
    });
    return { userId: input.userId, staffApprovalStatus: updated?.staffApprovalStatus ?? input.decision };
  }),
});
