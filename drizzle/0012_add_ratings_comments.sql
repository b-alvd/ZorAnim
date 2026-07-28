CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`film_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `film_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`film_id` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `film_ratings_user_film_unique` ON `film_ratings` (`user_id`,`film_id`);