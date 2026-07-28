DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `films` ALTER COLUMN "duration_minutes" TO "duration_minutes" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `films` DROP COLUMN `duration`;--> statement-breakpoint
ALTER TABLE `films` DROP COLUMN `is_new`;