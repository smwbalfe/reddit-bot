ALTER TABLE "RedditPost" ALTER COLUMN "analysisData" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "ICP" ADD COLUMN "data" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ICP" DROP COLUMN "keywords";--> statement-breakpoint
ALTER TABLE "ICP" DROP COLUMN "subreddits";