ALTER TABLE `card` ADD `due` text;--> statement-breakpoint
ALTER TABLE `card` ADD `stability` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `difficulty` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `elapsed_days` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `schedules_days` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `reps` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `lapses` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `state` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `last_review` text;--> statement-breakpoint
ALTER TABLE `card` DROP COLUMN `file_keys`;