CREATE TABLE "SystemFlag" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SystemFlag_key_unique" UNIQUE("key")
);
