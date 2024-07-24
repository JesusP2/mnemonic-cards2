ALTER TABLE `card` RENAME COLUMN `front_text` TO `front_markdown`;--> statement-breakpoint
ALTER TABLE `card` RENAME COLUMN `back_text` TO `file_keys`;--> statement-breakpoint
ALTER TABLE `card` DROP COLUMN `front_image_key`;--> statement-breakpoint
ALTER TABLE `card` DROP COLUMN `back_image_key`;