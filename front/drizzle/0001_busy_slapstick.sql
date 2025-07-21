CREATE TABLE "RedditPost" (
	"id" serial PRIMARY KEY NOT NULL,
	"redditId" varchar NOT NULL,
	"subreddit" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RedditPost_redditId_unique" UNIQUE("redditId")
);
