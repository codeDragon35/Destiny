ALTER TABLE "trips" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "best_months" smallint[];--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "season_note" text;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"start_month" smallint NOT NULL,
	"start_day" smallint,
	"end_month" smallint,
	"end_day" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_place_slug_idx" ON "events" USING btree ("place_id","slug");--> statement-breakpoint
CREATE INDEX "events_month_idx" ON "events" USING btree ("start_month");
