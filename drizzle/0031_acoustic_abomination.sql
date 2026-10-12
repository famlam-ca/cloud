ALTER TYPE "public"."activity_reference_type" ADD VALUE 'activity' BEFORE 'instance';--> statement-breakpoint
CREATE INDEX "activity_timestamp_idx" ON "activity" USING btree ("timestamp");