CREATE TABLE `github_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login` text NOT NULL,
	`name` text,
	`html_url` text NOT NULL,
	`avatar_url` text,
	`personal_access_token` text NOT NULL,
	`expired_at` integer
);
