CREATE TABLE "page_view" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"page_title" text,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"browser" text,
	"os" text,
	"device" text,
	"screen_width" text,
	"language" text,
	"session_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"last_sync_at" timestamp NOT NULL,
	"last_notes_sync_at" timestamp,
	"last_comments_sync_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "page_view_path_idx" ON "page_view" USING btree ("path");--> statement-breakpoint
CREATE INDEX "page_view_created_at_idx" ON "page_view" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_view_session_hash_idx" ON "page_view" USING btree ("session_hash");--> statement-breakpoint
CREATE INDEX "page_view_utm_source_idx" ON "page_view" USING btree ("utm_source");