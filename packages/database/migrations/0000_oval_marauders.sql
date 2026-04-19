CREATE TABLE `analyzed_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`virality_score` real NOT NULL,
	`content_type` text NOT NULL,
	`hook_angles` text NOT NULL,
	`script_outline` text,
	`reasoning` text NOT NULL,
	`analyzed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analyzed_posts_post_id_unique` ON `analyzed_posts` (`post_id`);--> statement-breakpoint
CREATE INDEX `analyzed_virality_idx` ON `analyzed_posts` (`virality_score`);--> statement-breakpoint
CREATE INDEX `analyzed_type_idx` ON `analyzed_posts` (`content_type`);--> statement-breakpoint
CREATE TABLE `cron_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`run_at` text DEFAULT (datetime('now')) NOT NULL,
	`status` text NOT NULL,
	`posts_scraped` integer DEFAULT 0 NOT NULL,
	`posts_analyzed` integer DEFAULT 0 NOT NULL,
	`posts_skipped` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cron_logs_source_idx` ON `cron_logs` (`source_id`,`run_at`);--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `post_tags_post_idx` ON `post_tags` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_tags_tag_idx` ON `post_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`platform` text NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`author_handle` text NOT NULL,
	`published_at` text NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`comments_count` integer DEFAULT 0 NOT NULL,
	`shares_count` integer DEFAULT 0 NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`total_engagement` integer DEFAULT 0 NOT NULL,
	`scraped_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posts_platform_external_idx` ON `posts` (`platform`,`external_id`);--> statement-breakpoint
CREATE INDEX `posts_source_idx` ON `posts` (`source_id`);--> statement-breakpoint
CREATE INDEX `posts_published_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `posts_engagement_idx` ON `posts` (`total_engagement`);--> statement-breakpoint
CREATE TABLE `saved_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`saved_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `saved_ideas_user_idx` ON `saved_ideas` (`user_id`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`target_id` text NOT NULL,
	`cron_schedule` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label_vi` text NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);