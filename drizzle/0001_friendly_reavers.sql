CREATE TYPE "public"."traffic_channel" AS ENUM('organic', 'ai', 'social', 'referral', 'direct', 'internal', 'unknown');--> statement-breakpoint
CREATE TABLE "outbound_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"href" text NOT NULL,
	"dest_host" text,
	"label" text,
	"placement" text,
	"path" text,
	"visitor_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"referrer_host" text,
	"channel" "traffic_channel" DEFAULT 'unknown' NOT NULL,
	"ai_source" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"country" text,
	"visitor_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "clicks_created_idx" ON "outbound_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "visits_created_idx" ON "visits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "visits_channel_idx" ON "visits" USING btree ("channel");