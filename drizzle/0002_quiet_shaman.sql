CREATE TABLE `instruction_ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instruction` integer NOT NULL,
	`ingredient` integer NOT NULL,
	FOREIGN KEY (`instruction`) REFERENCES `instruction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instruction_ingredient_instruction_ingredient_unique` ON `instruction_ingredient` (`instruction`,`ingredient`);--> statement-breakpoint
ALTER TABLE `instruction` DROP COLUMN `ingredient_ids`;