ALTER TABLE `cook` ADD `ended_at` integer;--> statement-breakpoint
ALTER TABLE `cook` ADD `status` text DEFAULT 'in_progress' NOT NULL;--> statement-breakpoint
ALTER TABLE `cook` ADD `current_step` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `instruction` ADD `ingredient_ids` text;