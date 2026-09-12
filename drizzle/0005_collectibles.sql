CREATE TYPE "public"."collectible_kind" AS ENUM('stamp', 'passport', 'souvenir', 'book', 'badge');--> statement-breakpoint
CREATE TABLE "collectibles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" "collectible_kind" NOT NULL,
	"description" text,
	"where_to_get" text,
	"cost" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collectibles" ADD CONSTRAINT "collectibles_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collectibles_place_slug_idx" ON "collectibles" USING btree ("place_id","slug");--> statement-breakpoint
CREATE INDEX "collectibles_kind_idx" ON "collectibles" USING btree ("kind");
