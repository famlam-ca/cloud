CREATE TYPE "public"."notification_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TABLE "notification_read" (
	"notification_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "notification_read_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"expires_at" timestamp,
	"href" text,
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"severity" "notification_severity" DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"user_id" text
);
--> statement-breakpoint
ALTER TABLE "notification_read" ADD CONSTRAINT "notification_read_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_read" ADD CONSTRAINT "notification_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_read_userId_idx" ON "notification_read" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_published_at_idx" ON "notification" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "notification_userId_published_at_idx" ON "notification" USING btree ("user_id","published_at");