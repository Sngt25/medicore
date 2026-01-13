CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`detail` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`assigned_worker_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`initial_description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint
CREATE INDEX `chat_district_status_idx` ON `chats` (`district_id`,`status`);--> statement-breakpoint
CREATE INDEX `chat_patient_idx` ON `chats` (`patient_id`);--> statement-breakpoint
CREATE INDEX `chat_worker_idx` ON `chats` (`assigned_worker_id`);--> statement-breakpoint
CREATE TABLE `districts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`contact_info` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `district_name_idx` ON `districts` (`name`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`chat_id` text,
	`pathname` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `file_owner_idx` ON `files` (`owner_id`);--> statement-breakpoint
CREATE INDEX `file_chat_idx` ON `files` (`chat_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'patient',
	`district_id` text,
	`google_sub` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`attachments` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `message_chat_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `message_created_at_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_at` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`linked_patient_id` text,
	`linked_chat_id` text,
	`created_by_worker_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `task_worker_idx` ON `tasks` (`created_by_worker_id`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `task_patient_idx` ON `tasks` (`linked_patient_id`);