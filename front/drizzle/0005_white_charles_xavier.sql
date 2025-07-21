CREATE TABLE "Config" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"subreddit" varchar NOT NULL,
	"agentPrompt" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
