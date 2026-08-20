import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  complaintActivity,
  complaintAttachments,
  complaints,
  InsertUser,
  notifications,
  users,
  userProfiles,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("CampusFix database is unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };

  (['name', 'email', 'loginMethod'] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  profile: { name: string; hostel: string; gender: string; mobileNumber?: string | null; rollNumber?: string | null; registrationNumber?: string | null; role?: "student" | "staff"; staffApprovalStatus: "not_required" | "pending" | "approved" | "rejected"; staffPhotoKey?: string | null; staffWorkingFields?: string | null },
) {
  const db = await requireDb();
  await db.update(users).set({ name: profile.name }).where(eq(users.id, userId));
  const insertValues = {
    userId,
    role: profile.role ?? "student",
    hostel: profile.hostel,
    gender: profile.gender,
    mobileNumber: profile.mobileNumber ?? null,
    rollNumber: profile.rollNumber ?? null,
    registrationNumber: profile.registrationNumber ?? null,
    staffApprovalStatus: profile.staffApprovalStatus,
    ...(profile.staffPhotoKey !== undefined ? { staffPhotoKey: profile.staffPhotoKey } : {}),
    ...(profile.staffWorkingFields !== undefined ? { staffWorkingFields: profile.staffWorkingFields } : {}),
  };
  const updateValues = {
    role: profile.role ?? "student",
    hostel: profile.hostel,
    gender: profile.gender,
    mobileNumber: profile.mobileNumber ?? null,
    rollNumber: profile.rollNumber ?? null,
    registrationNumber: profile.registrationNumber ?? null,
    staffApprovalStatus: profile.staffApprovalStatus,
    ...(profile.staffPhotoKey !== undefined ? { staffPhotoKey: profile.staffPhotoKey } : {}),
    ...(profile.staffWorkingFields !== undefined ? { staffWorkingFields: profile.staffWorkingFields } : {}),
  };
  await db
    .insert(userProfiles)
    .values(insertValues)
    .onDuplicateKeyUpdate({ set: updateValues });
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getUserProfile(userId: number) {
  const db = await requireDb();
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getApplicantDetails(userId: number) {
  const db = await requireDb();
  const result = await db
    .select({
      name: users.name,
      email: users.email,
      role: userProfiles.role,
      hostel: userProfiles.hostel,
      gender: userProfiles.gender,
      mobileNumber: userProfiles.mobileNumber,
      rollNumber: userProfiles.rollNumber,
      registrationNumber: userProfiles.registrationNumber,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function getRegisteredUserStats() {
  const db = await requireDb();
  const [totalRows, roleRows] = await Promise.all([
    db.select({ total: count() }).from(userProfiles),
    db.select({ role: userProfiles.role, total: count() }).from(userProfiles).groupBy(userProfiles.role),
  ]);
  const countForRole = (role: "student" | "staff") => Number(roleRows.find(row => row.role === role)?.total ?? 0);
  return {
    total: Number(totalRows[0]?.total ?? 0),
    students: countForRole("student"),
    staff: countForRole("staff"),
  };
}

export async function getPendingStaffProfiles() {
  const db = await requireDb();
  return db
    .select({
      userId: userProfiles.userId,
      name: users.name,
      email: users.email,
      hostel: userProfiles.hostel,
      gender: userProfiles.gender,
      mobileNumber: userProfiles.mobileNumber,
      staffPhotoKey: userProfiles.staffPhotoKey,
      staffWorkingFields: userProfiles.staffWorkingFields,
      createdAt: userProfiles.createdAt,
    })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.userId))
    .where(and(eq(userProfiles.role, "staff"), eq(userProfiles.staffApprovalStatus, "pending")))
    .orderBy(desc(userProfiles.createdAt));
}

export async function updateStaffApprovalStatus(userId: number, status: "approved" | "rejected") {
  const db = await requireDb();
  await db.update(userProfiles).set({ staffApprovalStatus: status }).where(and(eq(userProfiles.userId, userId), eq(userProfiles.role, "staff")));
  return getUserProfile(userId);
}

export async function createPendingAttachment(input: {
  userId: number;
  kind: "photo" | "application";
  fileName: string;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
}) {
  const db = await requireDb();
  const result = await db.insert(complaintAttachments).values(input);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(complaintAttachments).where(eq(complaintAttachments.id, id)).limit(1);
  return rows[0];
}

export async function getOwnedAttachments(userId: number, attachmentIds: number[]) {
  if (!attachmentIds.length) return [];
  const db = await requireDb();
  return db
    .select()
    .from(complaintAttachments)
    .where(and(eq(complaintAttachments.userId, userId), isNull(complaintAttachments.complaintId), inArray(complaintAttachments.id, attachmentIds)));
}

export async function createComplaint(input: {
  complaintId: string;
  userId: number;
  description: string;
  hostel: string;
  block: string;
  room: string;
  departmentCategory: string;
  priorityLevel: "Low" | "Medium" | "High";
  aiSummary: string;
}) {
  const db = await requireDb();
  const result = await db.insert(complaints).values(input);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
  return rows[0];
}

export async function linkAttachmentsToComplaint(userId: number, complaintId: number, attachmentIds: number[]) {
  if (!attachmentIds.length) return;
  const db = await requireDb();
  await db
    .update(complaintAttachments)
    .set({ complaintId })
    .where(and(eq(complaintAttachments.userId, userId), inArray(complaintAttachments.id, attachmentIds)));
}

export async function addComplaintActivity(input: {
  complaintId: number;
  actorUserId: number | null;
  eventType: string;
  message: string;
}) {
  const db = await requireDb();
  await db.insert(complaintActivity).values(input);
}

export async function createNotification(input: {
  userId: number;
  complaintId?: number;
  title: string;
  message: string;
}) {
  const db = await requireDb();
  await db.insert(notifications).values({
    ...input,
    complaintId: input.complaintId ?? null,
  });
}

export async function getComplaintsForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(complaints).where(eq(complaints.userId, userId)).orderBy(desc(complaints.updatedAt));
}

export async function getComplaintDetail(complaintId: number) {
  const db = await requireDb();
  const complaint = (await db.select().from(complaints).where(eq(complaints.id, complaintId)).limit(1))[0];
  if (!complaint) return undefined;
  const [attachments, activity] = await Promise.all([
    db.select().from(complaintAttachments).where(eq(complaintAttachments.complaintId, complaintId)),
    db.select().from(complaintActivity).where(eq(complaintActivity.complaintId, complaintId)).orderBy(desc(complaintActivity.createdAt)),
  ]);
  return { complaint, attachments, activity };
}

export async function listAdminComplaints(filters: {
  departmentCategory?: string;
  priorityLevel?: "Low" | "Medium" | "High";
  status?: "Pending" | "Checked In" | "In Progress" | "Resolved";
}) {
  const db = await requireDb();
  const conditions = [];
  if (filters.departmentCategory) conditions.push(eq(complaints.departmentCategory, filters.departmentCategory));
  if (filters.priorityLevel) conditions.push(eq(complaints.priorityLevel, filters.priorityLevel));
  if (filters.status) conditions.push(eq(complaints.status, filters.status));
  if (!conditions.length) return db.select().from(complaints).orderBy(desc(complaints.updatedAt));
  return db.select().from(complaints).where(and(...conditions)).orderBy(desc(complaints.updatedAt));
}

export async function updateComplaintStatus(
  complaintId: number,
  status: "Pending" | "Checked In" | "In Progress" | "Resolved",
) {
  const db = await requireDb();
  await db.update(complaints).set({ status }).where(eq(complaints.id, complaintId));
  const rows = await db.select().from(complaints).where(eq(complaints.id, complaintId)).limit(1);
  return rows[0];
}

export async function getNotificationsForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await requireDb();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}
