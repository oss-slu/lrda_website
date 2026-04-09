CREATE TABLE "sync_run" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"duration_ms" integer,
	"status" text DEFAULT 'running' NOT NULL,
	"notes_created" integer DEFAULT 0 NOT NULL,
	"notes_updated" integer DEFAULT 0 NOT NULL,
	"notes_skipped" integer DEFAULT 0 NOT NULL,
	"notes_errored" integer DEFAULT 0 NOT NULL,
	"error" text,
	"triggered_by" text
);
--> statement-breakpoint
CREATE TABLE "sync_run_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"note_id" text NOT NULL,
	"action" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_run_detail" ADD CONSTRAINT "sync_run_detail_run_id_sync_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."sync_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_run_started_at_idx" ON "sync_run" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "sync_run_detail_run_id_idx" ON "sync_run_detail" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "sync_run_detail_note_id_idx" ON "sync_run_detail" USING btree ("note_id");