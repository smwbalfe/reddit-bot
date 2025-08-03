ALTER TABLE "RedditPost" ADD COLUMN "analysisData" json;--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "leadQuality";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "painPoints";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "productFitScore";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "intentSignalsScore";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "urgencyIndicatorsScore";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "decisionAuthorityScore";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "engagementQualityScore";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "productFitJustification";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "intentSignalsJustification";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "urgencyIndicatorsJustification";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "decisionAuthorityJustification";--> statement-breakpoint
ALTER TABLE "RedditPost" DROP COLUMN "engagementQualityJustification";