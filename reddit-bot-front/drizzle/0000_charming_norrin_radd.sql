CREATE TABLE "Account" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"welcomeEmailSent" boolean DEFAULT false NOT NULL,
	CONSTRAINT "Account_userId_unique" UNIQUE("userId")
);
