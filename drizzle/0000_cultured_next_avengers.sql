CREATE TYPE "public"."cron_status" AS ENUM('ok', 'failed');--> statement-breakpoint
CREATE TYPE "public"."keyword_source" AS ENUM('manual', 'initial_seed', 'gsc');--> statement-breakpoint
CREATE TYPE "public"."keyword_status" AS ENUM('pending', 'used', 'failed');--> statement-breakpoint
CREATE TYPE "public"."moderation_stage" AS ENUM('blocklist', 'model');--> statement-breakpoint
CREATE TYPE "public"."prompt_source" AS ENUM('user', 'seed');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('published', 'private', 'blocked', 'pending_review');--> statement-breakpoint
CREATE TABLE "cron_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" text NOT NULL,
	"period_key" text NOT NULL,
	"status" "cron_status" NOT NULL,
	"detail" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"ip_hash" text NOT NULL,
	"prompt_id" uuid,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micros" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"role" text NOT NULL,
	"output_type" text NOT NULL,
	"is_business" boolean NOT NULL,
	"status" "keyword_status" DEFAULT 'pending' NOT NULL,
	"used_at" timestamp with time zone,
	"source" "keyword_source" DEFAULT 'initial_seed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_slug" text NOT NULL,
	"url" text NOT NULL,
	"status_code" integer,
	"ok" boolean NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid,
	"stage" "moderation_stage" NOT NULL,
	"reason" text NOT NULL,
	"matched_pattern" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_spend" (
	"month" text PRIMARY KEY NOT NULL,
	"cost_micros" integer DEFAULT 0 NOT NULL,
	"generations" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_daily_stats" (
	"prompt_id" uuid NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "prompt_daily_stats_prompt_id_date_pk" PRIMARY KEY("prompt_id","date")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"prompt_text" text NOT NULL,
	"instructions" jsonb NOT NULL,
	"recommended_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category_tags" text[] DEFAULT '{}' NOT NULL,
	"role" text NOT NULL,
	"ai_tool" text NOT NULL,
	"output_type" text NOT NULL,
	"task_input" text NOT NULL,
	"is_business" boolean NOT NULL,
	"is_agent_or_automation" boolean NOT NULL,
	"source" "prompt_source" NOT NULL,
	"user_id" uuid,
	"status" "prompt_status" DEFAULT 'published' NOT NULL,
	"moderation" jsonb,
	"quality_score" smallint,
	"promoted_at" timestamp with time zone,
	"demoted_at" timestamp with time zone,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"reason" text,
	"visitor_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_name" text NOT NULL,
	"display_name" text NOT NULL,
	"category" text,
	"count" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"sample_prompt_ids" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "tool_opportunities_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "upvotes" (
	"prompt_id" uuid NOT NULL,
	"visitor_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upvotes_prompt_id_visitor_hash_pk" PRIMARY KEY("prompt_id","visitor_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hubspot_contact_id" text,
	"hubspot_synced_at" timestamp with time zone,
	"categories_used" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_daily_stats" ADD CONSTRAINT "prompt_daily_stats_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cron_runs_job_period_idx" ON "cron_runs" USING btree ("job_name","period_key");--> statement-breakpoint
CREATE INDEX "generations_ip_idx" ON "generations" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "generations_user_idx" ON "generations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "prompts_status_idx" ON "prompts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prompts_upvotes_idx" ON "prompts" USING btree ("upvote_count");--> statement-breakpoint
CREATE INDEX "prompts_promoted_idx" ON "prompts" USING btree ("promoted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_opps_normalized_idx" ON "tool_opportunities" USING btree ("normalized_name");