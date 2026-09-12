ALTER TABLE "cities" ADD COLUMN "photo_ref" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "photo_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "photo_ref" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "photo_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "photo_ref" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "photo_fetched_at" timestamp with time zone;