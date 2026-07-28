CREATE TABLE `artist_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bio` text NOT NULL,
	`avatar` text,
	`portfolio_url` text,
	`contact_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `film_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`synopsis` text NOT NULL,
	`year` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`rating` text NOT NULL,
	`category` text NOT NULL,
	`artist_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`poster` text NOT NULL,
	`video_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
