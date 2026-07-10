/**
 * One-time: generate real launch prompts via the API and save as seed data.
 * Output: scripts/seed-data.json (loaded into the DB by scripts/seed-feed.ts).
 * Run locally with ANTHROPIC_API_KEY set.
 */
import fs from "node:fs";
import { loadEnvLocal } from "./eval/loadEnv";
loadEnvLocal();
import { generatePrompt } from "@/lib/generate";
import { presentGeneration } from "@/lib/present";

const TOPICS: { task: string; role: string; aiTool: string; outputType: string; promote: boolean }[] = [
  { task: "Write cold outbound emails for a SaaS demo offer to mid-market HR leaders", role: "Sales/SDR", aiTool: "ChatGPT", outputType: "Email/Outreach", promote: true },
  { task: "Plan a 7-day Italy trip on a budget for two people in October", role: "Personal Use", aiTool: "ChatGPT", outputType: "Strategy/Plan", promote: true },
  { task: "Build an agent that triages inbound support tickets by urgency and routes them", role: "Founder/CEO", aiTool: "Claude", outputType: "Agent/Workflow", promote: true },
  { task: "Write a best man speech, funny but heartfelt", role: "Personal Use", aiTool: "Claude", outputType: "Writing/Personal", promote: true },
  { task: "Create a 30-day LinkedIn content calendar to build authority for a B2B consulting brand", role: "Creator/Influencer", aiTool: "ChatGPT", outputType: "Content/Copy", promote: true },
  { task: "Help me learn conversational Spanish in 3 months, 30 minutes a day", role: "Student", aiTool: "Gemini", outputType: "Learning/How-To", promote: true },
  { task: "Draft a PRD for adding usage-based billing to a developer tools product", role: "Product Manager", aiTool: "Claude", outputType: "Strategy/Plan", promote: false },
  { task: "Midjourney prompt for a fantasy landscape: floating city above a stormy ocean at golden hour", role: "Personal Use", aiTool: "Midjourney/Image AI", outputType: "Image/Creative", promote: true },
  { task: "Write a renewal email sequence for at-risk customers 60 days before contract end", role: "Customer Success", aiTool: "Gemini", outputType: "Email/Outreach", promote: false },
  { task: "Build a 3-day-a-week beginner strength program using only dumbbells at home", role: "Personal Use", aiTool: "ChatGPT", outputType: "Learning/How-To", promote: true },
  { task: "Write a job description and phone screen questions for a senior product designer", role: "Recruiter/HR", aiTool: "ChatGPT", outputType: "Content/Copy", promote: false },
  { task: "Analyze our top 5 competitors' pricing and positioning and find gaps to exploit", role: "Founder/CEO", aiTool: "Claude", outputType: "Analysis/Research", promote: true },
  { task: "Create a weekly high-protein meal prep plan under $80 with minimal weekday cooking", role: "Personal Use", aiTool: "ChatGPT", outputType: "Strategy/Plan", promote: false },
  { task: "Write an SEO content brief for the keyword 'crm for small business'", role: "Content/SEO", aiTool: "Claude", outputType: "Content/Copy", promote: false },
  { task: "Build a HubSpot automation that scores inbound leads and alerts sales in Slack", role: "Marketer", aiTool: "Claude", outputType: "Code/Automation", promote: true },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("no ANTHROPIC_API_KEY"); process.exit(1); }
  const out: unknown[] = [];
  let i = 0;
  for (const t of TOPICS) {
    i++;
    process.stdout.write(`[${i}/${TOPICS.length}] ${t.task.slice(0, 45)}... `);
    const r = await generatePrompt({ task: t.task, role: t.role, aiTool: t.aiTool, outputType: t.outputType });
    if (r.status !== "ok") { console.log(`skip (${r.status})`); continue; }
    const p = presentGeneration(r.output, { role: t.role, outputType: t.outputType, aiTool: t.aiTool });
    out.push({
      slug: t.promote ? slugify(p.title) : null,
      title: p.title,
      promptText: p.prompt,
      instructions: p.instructions.map((segs) => segs.map((s) => s.value).join("")),
      recommendedTools: r.output.recommended_tools,
      categoryTags: p.categoryTags,
      role: t.role, aiTool: t.aiTool, outputType: t.outputType,
      taskInput: t.task,
      isBusiness: p.isBusiness,
      isAgentOrAutomation: r.output.is_agent_or_automation,
      promote: t.promote,
      moderation: r.output.moderation,
    });
    console.log("ok");
  }
  fs.writeFileSync("scripts/seed-data.json", JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} prompts to scripts/seed-data.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
