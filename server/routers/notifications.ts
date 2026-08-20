import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getNotificationsForUser(ctx.user.id)),
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(ctx.user.id, input.notificationId);
      return { success: true } as const;
    }),
});
