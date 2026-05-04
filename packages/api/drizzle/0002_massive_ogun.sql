CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audio_note_id_idx" ON "audio" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "comment_note_id_idx" ON "comment" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "comment_author_id_idx" ON "comment" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comment_thread_id_idx" ON "comment" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "media_note_id_idx" ON "media" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "note_creator_id_idx" ON "note" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_instructor_id_idx" ON "user" USING btree ("instructor_id");