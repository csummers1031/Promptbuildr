import type { ToolRef } from "@/lib/tools/resolve";

export interface FeedPrompt {
  id: string;
  slug: string | null;
  title: string;
  promptText: string;
  instructions: string[];
  recommendedTools: ToolRef[];
  categoryTags: string[];
  role: string;
  aiTool: string;
  outputType: string;
  isBusiness: boolean;
  isAgentOrAutomation: boolean;
  source: "user" | "seed";
  upvoteCount: number;
  viewCount: number;
  promotedAt: string | null;
  createdAt: string; // ISO
}

export const SORTS = ["today", "week", "month", "all", "newest"] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABELS: Record<Sort, string> = {
  today: "Top Today",
  week: "This Week",
  month: "This Month",
  all: "All-Time",
  newest: "Newest",
};

export interface FeedQuery {
  sort: Sort;
  role?: string;
  aiTool?: string;
  outputType?: string;
  limit: number;
  offset: number;
}

export function parseSort(v: string | null | undefined): Sort {
  return (SORTS as readonly string[]).includes(v ?? "") ? (v as Sort) : "week";
}

/** Window start for a time-boxed sort; null = no lower bound. */
export function windowStart(sort: Sort, now: Date): Date | null {
  const d = new Date(now);
  switch (sort) {
    case "today":
      d.setUTCHours(0, 0, 0, 0);
      return d;
    case "week":
      d.setUTCDate(d.getUTCDate() - 7);
      return d;
    case "month":
      d.setUTCDate(d.getUTCDate() - 30);
      return d;
    default:
      return null; // all-time, newest
  }
}

/** Sort comparator applied in JS (dev fallback + secondary ordering). */
export function compareForSort(a: FeedPrompt, b: FeedPrompt, sort: Sort): number {
  if (sort === "newest") {
    return b.createdAt.localeCompare(a.createdAt);
  }
  // top windows + all-time: upvotes, then views, then recency
  if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
  if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
  return b.createdAt.localeCompare(a.createdAt);
}
