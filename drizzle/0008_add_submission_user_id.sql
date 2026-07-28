ALTER TABLE `artist_submissions` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `film_submissions` ADD `user_id` text REFERENCES users(id);