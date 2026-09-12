ALTER TABLE "places" DROP COLUMN IF EXISTS "photo_ref";--> statement-breakpoint
ALTER TABLE "cities" DROP COLUMN IF EXISTS "photo_ref";--> statement-breakpoint
ALTER TABLE "countries" DROP COLUMN IF EXISTS "photo_ref";--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "wikidata_id" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "wikidata_id" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "wikidata_id" text;
