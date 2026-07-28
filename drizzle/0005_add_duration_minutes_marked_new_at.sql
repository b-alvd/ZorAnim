DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `films` ALTER COLUMN "duration" TO "duration" text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `films` ALTER COLUMN "is_new" TO "is_new" integer;--> statement-breakpoint
ALTER TABLE `films` ADD `duration_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `films` ADD `marked_new_at` text;