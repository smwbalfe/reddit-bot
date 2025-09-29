CREATE TABLE "Account" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"welcomeEmailSent" boolean DEFAULT false NOT NULL,
	CONSTRAINT "Account_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ICP" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"name" varchar NOT NULL,
	"website" varchar,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"leadLimit" integer DEFAULT 100 NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProcessedPost" (
	"id" serial PRIMARY KEY NOT NULL,
	"icpId" integer NOT NULL,
	"submissionId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RedditPost" (
	"id" serial PRIMARY KEY NOT NULL,
	"icpId" integer NOT NULL,
	"submissionId" varchar NOT NULL,
	"subreddit" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"url" text NOT NULL,
	"leadQuality" integer,
	"leadStatus" varchar DEFAULT 'new' NOT NULL,
	"analysisData" jsonb,
	"redditCreatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RedditPost_submissionId_unique" UNIQUE("submissionId")
);
--> statement-breakpoint
CREATE TABLE "SystemFlag" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SystemFlag_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "UsageTracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"repliesGenerated" integer DEFAULT 0 NOT NULL,
	"qualifiedLeads" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ProcessedPost" ADD CONSTRAINT "ProcessedPost_icpId_ICP_id_fk" FOREIGN KEY ("icpId") REFERENCES "public"."ICP"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RedditPost" ADD CONSTRAINT "RedditPost_icpId_ICP_id_fk" FOREIGN KEY ("icpId") REFERENCES "public"."ICP"("id") ON DELETE no action ON UPDATE no action;