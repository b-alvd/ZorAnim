CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bio` text NOT NULL,
	`avatar` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `films` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`synopsis` text NOT NULL,
	`year` integer NOT NULL,
	`duration` text NOT NULL,
	`rating` text NOT NULL,
	`category` text NOT NULL,
	`artist_id` text NOT NULL,
	`is_new` integer DEFAULT false NOT NULL,
	`poster` text NOT NULL,
	`video_url` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
