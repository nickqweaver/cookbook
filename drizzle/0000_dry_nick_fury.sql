CREATE TABLE `cook` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_by` text,
	`recipe` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`recipe`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cook_ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cook` integer NOT NULL,
	`ingredient` integer NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`cook`) REFERENCES `cook`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient`) REFERENCES `ingredient`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cook_ingredient_cook_ingredient_unique` ON `cook_ingredient` (`cook`,`ingredient`);--> statement-breakpoint
CREATE TABLE `cook_instruction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cook` integer NOT NULL,
	`instruction` integer NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`cook`) REFERENCES `cook`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instruction`) REFERENCES `instruction`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cook_instruction_cook_instruction_unique` ON `cook_instruction` (`cook`,`instruction`);--> statement-breakpoint
CREATE TABLE `ingredient` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	`recipe` integer NOT NULL,
	FOREIGN KEY (`recipe`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `instruction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order` integer NOT NULL,
	`recipe` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`recipe`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instruction_order_recipe_unique` ON `instruction` (`order`,`recipe`);--> statement-breakpoint
CREATE TABLE `recipe` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`servings` integer DEFAULT 1 NOT NULL,
	`preptime` integer NOT NULL,
	`cooktime` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_title_unique` ON `recipe` (`title`);