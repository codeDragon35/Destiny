CREATE TYPE "public"."activity_effort" AS ENUM('easy', 'moderate', 'hard');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text,
	"effort" "activity_effort" DEFAULT 'easy' NOT NULL,
	"minutes" integer NOT NULL,
	"cost" integer,
	"best_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_place_slug_idx" ON "activities" USING btree ("place_id","slug");--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "activity_ids" uuid[];
