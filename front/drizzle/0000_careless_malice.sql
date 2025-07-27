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
	"website" varchar NOT NULL,
	"description" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RedditPost" (
	"id" serial PRIMARY KEY NOT NULL,
	"icpId" integer NOT NULL,
	"subreddit" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar NOT NULL,
	"url" text NOT NULL,
	"confidence" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "RedditPost" ADD CONSTRAINT "RedditPost_icpId_ICP_id_fk" FOREIGN KEY ("icpId") REFERENCES "public"."ICP"("id") ON DELETE no action ON UPDATE no action;