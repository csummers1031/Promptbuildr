import type { FeedPrompt } from "./types";

/**
 * Dev-only sample feed content. Used ONLY when DATABASE_URL is absent, so the
 * feed renders during local development and previews. In production the real
 * DB provides content and these are never shown.
 *
 * Fixed timestamps (no Date.now in module scope) — offsets are relative to a
 * base and resolved at query time in the fallback.
 */

function ref(name: string, slug: string | null) {
  return {
    name,
    normalized: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    registrySlug: slug,
    homepageUrl: null,
  };
}

/** hoursAgo is resolved into a real ISO string by sampleFeed(now). */
interface SampleSeed extends Omit<FeedPrompt, "createdAt"> {
  hoursAgo: number;
}

const SEEDS: SampleSeed[] = [
  {
    id: "sample-1",
    slug: "cold-email-saas-demo",
    title: "3-email cold outreach sequence for a SaaS demo",
    promptText:
      "You are an expert B2B sales copywriter. Write a 3-email cold outreach sequence that books a demo of [PRODUCT] for [TARGET_ROLE] at [COMPANY_TYPE]. Keep each email under 90 words, lead with a specific pain point, and end with a soft CTA.",
    instructions: [
      "Paste the prompt into your AI tool and fill in [PRODUCT], [TARGET_ROLE], and [COMPANY_TYPE].",
      "Review the three emails for tone; each should be under 90 words.",
      "Import into your sending tool and set send timing across 8 days.",
    ],
    recommendedTools: [ref("Instantly", "instantly"), ref("Smartlead", "smartlead")],
    categoryTags: ["cold-outbound", "saas-sales"],
    role: "Sales/SDR",
    aiTool: "ChatGPT",
    outputType: "Email/Outreach",
    isBusiness: true,
    isAgentOrAutomation: false,
    source: "seed",
    upvoteCount: 42,
    viewCount: 310,
    promotedAt: "2026-07-01T00:00:00.000Z",
    hoursAgo: 6,
  },
  {
    id: "sample-2",
    slug: "italy-budget-trip",
    title: "7-day budget Italy itinerary planner",
    promptText:
      "You are a budget travel planner. Build a detailed 7-day Italy itinerary for two travelers visiting in [MONTH] with a total budget of [BUDGET]. Focus on [CITIES]. Include day-by-day activities, cheap eats, and a cost breakdown.",
    instructions: [
      "Paste into your AI tool and fill in [MONTH], [BUDGET], and [CITIES].",
      "Ask for a cost breakdown table if it isn't included.",
      "Save the itinerary and pre-book trains 4–6 weeks ahead.",
    ],
    recommendedTools: [],
    categoryTags: ["travel-planning", "budget-travel"],
    role: "Personal Use",
    aiTool: "ChatGPT",
    outputType: "Strategy/Plan",
    isBusiness: false,
    isAgentOrAutomation: false,
    source: "seed",
    upvoteCount: 88,
    viewCount: 540,
    promotedAt: "2026-06-20T00:00:00.000Z",
    hoursAgo: 30,
  },
  {
    id: "sample-3",
    slug: "support-ticket-triage-agent",
    title: "Support ticket triage agent workflow",
    promptText:
      "You are building a support triage agent. <task>Classify each ticket by urgency, categorize by issue type, and route to the right team.</task> Deploy to [PLATFORM]; tickets arrive from [SOURCE].",
    instructions: [
      "Choose your automation platform (n8n, Make, or Zapier) or the Claude API.",
      "Fill in [PLATFORM] and [SOURCE], plus your team routing rules.",
      "Test with 5–10 real recent tickets and tune the urgency thresholds.",
    ],
    recommendedTools: [ref("n8n", "n8n"), ref("Make", "make"), ref("Claude", "claude")],
    categoryTags: ["customer-support", "automation"],
    role: "Founder/CEO",
    aiTool: "Claude",
    outputType: "Agent/Workflow",
    isBusiness: true,
    isAgentOrAutomation: true,
    source: "seed",
    upvoteCount: 31,
    viewCount: 205,
    promotedAt: null,
    hoursAgo: 12,
  },
  {
    id: "sample-4",
    slug: "best-man-speech",
    title: "Heartfelt-but-funny best man speech",
    promptText:
      "You are a witty speechwriter. Write a best man speech for [FRIEND] at their wedding. Balance humor and heart, include a short story about [MEMORY], and land on a sincere toast. Keep it to 3–4 minutes spoken.",
    instructions: [
      "Fill in [FRIEND] and [MEMORY] with your own details.",
      "Read it aloud and time it — aim for 3–4 minutes.",
      "Ask for two alternate opening jokes if the first doesn't land.",
    ],
    recommendedTools: [],
    categoryTags: ["writing", "speeches"],
    role: "Personal Use",
    aiTool: "Claude",
    outputType: "Writing/Personal",
    isBusiness: false,
    isAgentOrAutomation: false,
    source: "user",
    upvoteCount: 64,
    viewCount: 402,
    promotedAt: "2026-06-28T00:00:00.000Z",
    hoursAgo: 50,
  },
  {
    id: "sample-5",
    slug: "linkedin-content-calendar",
    title: "30-day LinkedIn authority content calendar",
    promptText:
      "You are a B2B content strategist. Create a 30-day LinkedIn content calendar to build authority for [BRAND] in [NICHE]. Mix formats (story, how-to, hot take, case study) and give a hook for each day.",
    instructions: [
      "Fill in [BRAND] and [NICHE].",
      "Ask for hooks rewritten in your voice if they feel generic.",
      "Batch-write the top 5 posts first.",
    ],
    recommendedTools: [ref("Notion", "notion")],
    categoryTags: ["content", "personal-branding"],
    role: "Creator/Influencer",
    aiTool: "ChatGPT",
    outputType: "Content/Copy",
    isBusiness: true,
    isAgentOrAutomation: false,
    source: "seed",
    upvoteCount: 19,
    viewCount: 150,
    promotedAt: null,
    hoursAgo: 3,
  },
  {
    id: "sample-6",
    slug: "midjourney-fantasy-landscape",
    title: "Midjourney fantasy landscape prompt",
    promptText:
      "Floating city above a stormy ocean at golden hour, towering spires wrapped in mist, dramatic god-rays, cinematic composition, ultra-detailed, painterly digital art, rich teal-and-amber palette --ar 16:9 --style raw",
    instructions: [
      "Paste directly into Midjourney.",
      "Swap the palette or subject words to explore variations.",
      "Add --v 6 and re-roll for sharper detail.",
    ],
    recommendedTools: [],
    categoryTags: ["image-generation", "fantasy-art"],
    role: "Personal Use",
    aiTool: "Midjourney/Image AI",
    outputType: "Image/Creative",
    isBusiness: false,
    isAgentOrAutomation: false,
    source: "user",
    upvoteCount: 73,
    viewCount: 488,
    promotedAt: "2026-06-15T00:00:00.000Z",
    hoursAgo: 20,
  },
];

export function sampleFeed(now: Date): FeedPrompt[] {
  return SEEDS.map(({ hoursAgo, ...rest }) => ({
    ...rest,
    createdAt: new Date(now.getTime() - hoursAgo * 3600_000).toISOString(),
  }));
}
