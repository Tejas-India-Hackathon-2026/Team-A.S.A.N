import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const profileRoleValues = ["student", "staff"] as const;
export const staffApprovalStatusValues = ["not_required", "pending", "approved", "rejected"] as const;
export const priorityValues = ["Low", "Medium", "High"] as const;
export const complaintStatusValues = ["Pending", "Checked In", "In Progress", "Resolved"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", profileRoleValues).notNull(),
  hostel: varchar("hostel", { length: 128 }).notNull(),
  gender: varchar("gender", { length: 32 }).notNull(),
  mobileNumber: varchar("mobileNumber", { length: 32 }),
  rollNumber: varchar("rollNumber", { length: 64 }),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  staffApprovalStatus: mysqlEnum("staffApprovalStatus", staffApprovalStatusValues).default("not_required").notNull(),
  staffPhotoKey: varchar("staffPhotoKey", { length: 512 }),
  staffWorkingFields: text("staffWorkingFields"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const complaints = mysqlTable(
  "complaints",
  {
    id: int("id").autoincrement().primaryKey(),
    complaintId: varchar("complaintId", { length: 32 }).notNull().unique(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    hostel: varchar("hostel", { length: 128 }).notNull(),
    block: varchar("block", { length: 64 }).notNull(),
    room: varchar("room", { length: 64 }).notNull(),
    departmentCategory: varchar("departmentCategory", { length: 96 }).notNull(),
    priorityLevel: mysqlEnum("priorityLevel", priorityValues).notNull(),
    aiSummary: text("aiSummary").notNull(),
    status: mysqlEnum("status", complaintStatusValues).default("Pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userCreatedIdx: index("complaints_user_created_idx").on(table.userId, table.createdAt),
    statusIdx: index("complaints_status_idx").on(table.status),
    departmentIdx: index("complaints_department_idx").on(table.departmentCategory),
  }),
);

export const complaintAttachments = mysqlTable(
  "complaintAttachments",
  {
    id: int("id").autoincrement().primaryKey(),
    complaintId: int("complaintId").references(() => complaints.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["photo", "application"]).notNull(),
    fileName: varchar("fileName", { length: 160 }).notNull(),
    mimeType: varchar("mimeType", { length: 96 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: varchar("storageUrl", { length: 640 }).notNull(),
    fileSize: int("fileSize").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    complaintIdx: index("attachments_complaint_idx").on(table.complaintId),
    userIdx: index("attachments_user_idx").on(table.userId),
  }),
);

export const complaintActivity = mysqlTable(
  "complaintActivity",
  {
    id: int("id").autoincrement().primaryKey(),
    complaintId: int("complaintId").notNull().references(() => complaints.id, { onDelete: "cascade" }),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    message: varchar("message", { length: 512 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    complaintCreatedIdx: index("activity_complaint_created_idx").on(table.complaintId, table.createdAt),
  }),
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    complaintId: int("complaintId").references(() => complaints.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    message: varchar("message", { length: 512 }).notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type ComplaintAttachment = typeof complaintAttachments.$inferSelect;
