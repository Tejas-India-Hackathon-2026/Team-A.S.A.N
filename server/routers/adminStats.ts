import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const adminStatsRouter = router({
  registeredUsers: adminProcedure.query(() => db.getRegisteredUserStats()),
});
