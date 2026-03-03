ALTER TABLE "note" ALTER COLUMN "latitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "longitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "is_returned" boolean DEFAULT false NOT NULL;