CREATE TABLE `github_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login` text NOT NULL,
	`name` text,
	`html_url` text NOT NULL,
	`avatar_url` text,
	`personal_access_token` text NOT NULL,
	`expired_at` integer
);
--> statement-breakpoint
CREATE TABLE `github_owner` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_account_id` integer NOT NULL,
	`login` text NOT NULL,
	`html_url` text NOT NULL,
	`avatar_url` text,
	FOREIGN KEY (`github_account_id`) REFERENCES `github_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `github_repository` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_owner_id` integer NOT NULL,
	`name` text NOT NULL,
	`html_url` text NOT NULL,
	FOREIGN KEY (`github_owner_id`) REFERENCES `github_owner`(`id`) ON UPDATE no action ON DELETE cascade
);
