import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  jsonb,
  serial,
  date,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const promptStatus = pgEnum("prompt_status", [
  "published",
  "private",
  "blocked",
  "pending_review",
]);
export const promptSource = pgEnum("prompt_source", ["user", "seed"]);
export const keywordStatus = pgEnum("keyword_status", ["pending", "used", "failed"]);
export const keywordSource = pgEnum("keyword_source", ["manual", "initial_seed", "gsc"]);
export const moderationStage = pgEnum("moderation_stage", ["blocklist", "model"]);
export const cronStatus = pgEnum("cron_status", ["ok", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  hubspotContactId: text("hubspot_contact_id"),
  hubspotSyncedAt: timestamp("hubspot_synced_at", { withTimezone: true }),
  categoriesUsed: text("categories_used").array().default([]).notNull(),
});

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").unique(),
    title: text("title").notNull(),
    promptText: text("prompt_text").notNull(),
    instructions: jsonb("instructions").notNull(),
    recommendedTools: jsonb("recommended_tools").default([]).notNull(),
    categoryTags: text("category_tags").array().default([]).notNull(),
    role: text("role").notNull(),
    aiTool: text("ai_tool").notNull(),
    outputType: text("output_type").notNull(),
    taskInput: text("task_input").notNull(),
    isBusiness: boolean("is_business").notNull(),
    isAgentOrAutomation: boolean("is_agent_or_automation").notNull(),
    source: promptSource("source").notNull(),
    userId: uuid("user_id").references(() => users.id),
    status: promptStatus("status").notNull().default("published"),
    moderation: jsonb("moderation"),
    qualityScore: smallint("quality_score"),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
    demotedAt: timestamp("demoted_at", { withTimezone: true }),
    upvoteCount: integer("upvote_count").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("prompts_status_idx").on(t.status),
    index("prompts_upvotes_idx").on(t.upvoteCount),
    index("prompts_promoted_idx").on(t.promotedAt),
  ],
);

export const upvotes = pgTable(
  "upvotes",
  {
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.promptId, t.visitorHash] })],
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => prompts.id),
  reason: text("reason"),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    ipHash: text("ip_hash").notNull(),
    promptId: uuid("prompt_id").references(() => prompts.id),
    inputTokens: integer("input_tokens").default(0).notNull(),
    outputTokens: integer("output_tokens").default(0).notNull(),
    costMicros: integer("cost_micros").default(0).notNull(), // USD * 1e6 (integer micros)
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("generations_ip_idx").on(t.ipHash, t.createdAt),
    index("generations_user_idx").on(t.userId, t.createdAt),
  ],
);

export const keywordQueue = pgTable("keyword_queue", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  role: text("role").notNull(),
  outputType: text("output_type").notNull(),
  isBusiness: boolean("is_business").notNull(),
  status: keywordStatus("status").default("pending").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  source: keywordSource("source").default("initial_seed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const moderationLog = pgTable("moderation_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id").references(() => prompts.id),
  stage: moderationStage("stage").notNull(),
  reason: text("reason").notNull(),
  matchedPattern: text("matched_pattern"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const toolOpportunities = pgTable(
  "tool_opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** normalized tool name — the identity we count on */
    normalizedName: text("normalized_name").notNull().unique(),
    displayName: text("display_name").notNull(),
    category: text("category"),
    count: integer("count").default(1).notNull(),
    firstSeen: timestamp("first_seen", { withTimezone: true }).defaultNow().notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
    samplePromptIds: text("sample_prompt_ids").array().default([]).notNull(),
  },
  (t) => [uniqueIndex("tool_opps_normalized_idx").on(t.normalizedName)],
);

export const promptDailyStats = pgTable(
  "prompt_daily_stats",
  {
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id),
    date: date("date").notNull(),
    views: integer("views").default(0).notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.promptId, t.date] })],
);

export const linkChecks = pgTable("link_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolSlug: text("tool_slug").notNull(),
  url: text("url").notNull(),
  statusCode: integer("status_code"),
  ok: boolean("ok").notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cronRuns = pgTable(
  "cron_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobName: text("job_name").notNull(),
    periodKey: text("period_key").notNull(),
    status: cronStatus("status").notNull(),
    detail: jsonb("detail"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("cron_runs_job_period_idx").on(t.jobName, t.periodKey)],
);

/** Monthly API spend accumulator — feeds the circuit breaker. */
export const monthlySpend = pgTable("monthly_spend", {
  /** 'YYYY-MM' calendar month */
  month: text("month").primaryKey(),
  costMicros: integer("cost_micros").default(0).notNull(),
  generations: integer("generations").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
