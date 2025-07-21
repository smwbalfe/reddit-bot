ALTER TABLE "RedditPost" DROP CONSTRAINT "RedditPost_redditId_unique";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "redditId";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "author";