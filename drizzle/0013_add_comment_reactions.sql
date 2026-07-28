CREATE TABLE `comment_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comment_reactions_comment_user_unique` ON `comment_reactions` (`comment_id`,`user_id`);