CREATE TABLE `studio_members` (
	`id` text PRIMARY KEY NOT NULL,
	`studio_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`studio_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_members_studio_user_unique` ON `studio_members` (`studio_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `artists` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `artists` ADD `is_studio` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `artists` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `film_submissions` ADD `artist_id` text REFERENCES artists(id);