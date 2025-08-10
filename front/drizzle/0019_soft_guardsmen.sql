CREATE TABLE "UsageTracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"repliesGenerated" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
