CREATE TABLE `complaintActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` int NOT NULL,
	`actorUserId` int,
	`eventType` varchar(64) NOT NULL,
	`message` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complaintActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaintAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` int,
	`userId` int NOT NULL,
	`kind` enum('photo','application') NOT NULL,
	`fileName` varchar(160) NOT NULL,
	`mimeType` varchar(96) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(640) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complaintAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`description` text NOT NULL,
	`hostel` varchar(128) NOT NULL,
	`block` varchar(64) NOT NULL,
	`room` varchar(64) NOT NULL,
	`departmentCategory` varchar(96) NOT NULL,
	`priorityLevel` enum('Low','Medium','High') NOT NULL,
	`aiSummary` text NOT NULL,
	`status` enum('Pending','Checked In','In Progress','Resolved') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`),
	CONSTRAINT `complaints_complaintId_unique` UNIQUE(`complaintId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`complaintId` int,
	`title` varchar(160) NOT NULL,
	`message` varchar(512) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('student','staff') NOT NULL,
	`hostel` varchar(128) NOT NULL,
	`gender` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `complaintActivity` ADD CONSTRAINT `complaintActivity_complaintId_complaints_id_fk` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaintActivity` ADD CONSTRAINT `complaintActivity_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaintAttachments` ADD CONSTRAINT `complaintAttachments_complaintId_complaints_id_fk` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaintAttachments` ADD CONSTRAINT `complaintAttachments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_complaintId_complaints_id_fk` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD CONSTRAINT `userProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_complaint_created_idx` ON `complaintActivity` (`complaintId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `attachments_complaint_idx` ON `complaintAttachments` (`complaintId`);--> statement-breakpoint
CREATE INDEX `attachments_user_idx` ON `complaintAttachments` (`userId`);--> statement-breakpoint
CREATE INDEX `complaints_user_created_idx` ON `complaints` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `complaints_status_idx` ON `complaints` (`status`);--> statement-breakpoint
CREATE INDEX `complaints_department_idx` ON `complaints` (`departmentCategory`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`userId`,`createdAt`);