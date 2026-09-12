CREATE TABLE "trip_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"place_id" uuid,
	"collectible_id" uuid,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_progress" ADD CONSTRAINT "trip_progress_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_progress" ADD CONSTRAINT "trip_progress_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_progress" ADD CONSTRAINT "trip_progress_collectible_id_collectibles_id_fk" FOREIGN KEY ("collectible_id") REFERENCES "public"."collectibles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trip_progress_place_idx" ON "trip_progress" USING btree ("trip_id","place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_progress_collectible_idx" ON "trip_progress" USING btree ("trip_id","collectible_id");
