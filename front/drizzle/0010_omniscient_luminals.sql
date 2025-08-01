ALTER TABLE "RedditPost" ADD COLUMN "finalScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "productFitScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "intentSignalsScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "urgencyIndicatorsScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "decisionAuthorityScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "engagementQualityScore" integer;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "productFitJustification" text;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "intentSignalsJustification" text;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "urgencyIndicatorsJustification" text;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "decisionAuthorityJustification" text;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "engagementQualityJustification" text;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD COLUMN "overallAssessment" text;