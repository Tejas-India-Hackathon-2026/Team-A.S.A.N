import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { complaintsAdminRouter, complaintsRouter } from "./routers/complaints";
import { notificationsRouter } from "./routers/notifications";
import { profileRouter } from "./routers/profile";
import { adminStatsRouter } from "./routers/adminStats";
import { staffApprovalRouter } from "./routers/staffApproval";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: profileRouter,
  complaints: complaintsRouter,
  adminComplaints: complaintsAdminRouter,
  adminStats: adminStatsRouter,
  adminStaff: staffApprovalRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
