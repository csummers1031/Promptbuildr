ALTER TABLE "monthly_spend" ALTER COLUMN "cost_micros" SET DATA TYPE bigint;--> statement-breakpoint
CREATE UNIQUE INDEX "reports_prompt_visitor_idx" ON "reports" USING btree ("prompt_id","visitor_hash");--> statement-breakpoint
CREATE INDEX "reports_prompt_idx" ON "reports" USING btree ("prompt_id");