CREATE TABLE "ProcessedPost" (
	"id" serial PRIMARY KEY NOT NULL,
	"icpId" integer NOT NULL,
	"submissionId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ProcessedPost" ADD CONSTRAINT "ProcessedPost_icpId_ICP_id_fk" FOREIGN KEY ("icpId") REFERENCES "public"."ICP"("id") ON DELETE no action ON UPDATE no action;