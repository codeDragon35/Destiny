CREATE TYPE "public"."trip_interest" AS ENUM('nature', 'culture', 'food', 'hidden_gem');--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"days" integer NOT NULL,
	"interests" "trip_interest"[] NOT NULL,
	"dietary" text,
	"budget" integer,
	"plan" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trips_slug_idx" ON "trips" USING btree ("slug");
