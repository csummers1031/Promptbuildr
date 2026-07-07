import type { GenerationInput } from "@/lib/prompt/metaPrompt";

export interface EvalExpectations {
  isBusiness: boolean;
  isAgentOrAutomation: boolean;
  /** false => recommended_tools must be empty (personal tasks: never force-fit) */
  allowTools: boolean;
  /** Expected prompt syntax family for the target AI tool */
  syntax: "xml" | "markdown" | "image" | "any";
}

export interface EvalCase {
  id: string;
  label: string;
  input: GenerationInput;
  expect: EvalExpectations;
}

export const EVAL_CASES: EvalCase[] = [
  // ---- Business (12) ----
  {
    id: "b01-cold-email",
    label: "Cold outbound emails for SaaS demo offer",
    input: { task: "Write cold outbound emails for a SaaS demo offer targeting mid-market HR leaders", role: "Sales/SDR", aiTool: "ChatGPT", outputType: "Email/Outreach" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },
  {
    id: "b02-demand-gen-plan",
    label: "Q4 demand gen plan",
    input: { task: "Build a Q4 demand generation plan for a B2B fintech startup with a $30k budget", role: "Marketer", aiTool: "Claude", outputType: "Strategy/Plan" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "xml" },
  },
  {
    id: "b03-support-agent",
    label: "Support ticket triage agent",
    input: { task: "Build an agent that triages inbound support tickets by urgency and routes them to the right team", role: "Founder/CEO", aiTool: "Claude", outputType: "Agent/Workflow" },
    expect: { isBusiness: true, isAgentOrAutomation: true, allowTools: true, syntax: "xml" },
  },
  {
    id: "b04-revops-dashboard",
    label: "RevOps pipeline dashboard spec",
    input: { task: "Create a spreadsheet model that tracks pipeline coverage, stage conversion rates, and forecast accuracy by rep", role: "RevOps", aiTool: "ChatGPT", outputType: "Data/Spreadsheet" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },
  {
    id: "b05-seo-brief",
    label: "SEO content brief",
    input: { task: "Write an SEO content brief for the keyword 'crm for small business' targeting bottom-of-funnel buyers", role: "Content/SEO", aiTool: "Claude", outputType: "Content/Copy" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "xml" },
  },
  {
    id: "b06-renewal-email",
    label: "At-risk customer renewal email",
    input: { task: "Write a renewal outreach email sequence for customers showing low product usage 60 days before contract end", role: "Customer Success", aiTool: "Gemini", outputType: "Email/Outreach" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },
  {
    id: "b07-job-description",
    label: "Job description + screening questions",
    input: { task: "Write a job description and phone screen questions for a senior product designer role at a healthtech company", role: "Recruiter/HR", aiTool: "ChatGPT", outputType: "Content/Copy" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },
  {
    id: "b08-prd",
    label: "PRD for a new feature",
    input: { task: "Draft a PRD for adding usage-based billing to our developer tools product", role: "Product Manager", aiTool: "Claude", outputType: "Strategy/Plan" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "xml" },
  },
  {
    id: "b09-agency-proposal",
    label: "Agency client proposal",
    input: { task: "Write a proposal for a 6-month paid media retainer for an ecommerce client doing $2M/year", role: "Agency Owner", aiTool: "ChatGPT", outputType: "Content/Copy" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },
  {
    id: "b10-hubspot-automation",
    label: "HubSpot lead routing automation",
    input: { task: "Build an automation that scores inbound leads in HubSpot and routes hot leads to sales with a Slack alert", role: "Marketer", aiTool: "Claude", outputType: "Code/Automation" },
    expect: { isBusiness: true, isAgentOrAutomation: true, allowTools: true, syntax: "xml" },
  },
  {
    id: "b11-competitor-analysis",
    label: "Competitor analysis",
    input: { task: "Analyze our top 5 competitors' pricing pages and positioning and identify gaps we can exploit", role: "Founder/CEO", aiTool: "Claude", outputType: "Analysis/Research" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "xml" },
  },
  {
    id: "b12-linkedin-calendar",
    label: "LinkedIn content calendar for consulting brand",
    input: { task: "Create a 30-day LinkedIn content calendar to build authority for my B2B consulting brand", role: "Creator/Influencer", aiTool: "ChatGPT", outputType: "Content/Copy" },
    expect: { isBusiness: true, isAgentOrAutomation: false, allowTools: true, syntax: "markdown" },
  },

  // ---- Personal / consumer (8) ----
  {
    id: "p01-italy-trip",
    label: "7-day Italy trip on a budget",
    input: { task: "Plan a 7-day Italy trip on a budget for two people in October", role: "Personal Use", aiTool: "ChatGPT", outputType: "Strategy/Plan" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
  },
  {
    id: "p02-best-man-speech",
    label: "Best man speech",
    input: { task: "Write a best man speech for my college roommate's wedding, funny but heartfelt", role: "Personal Use", aiTool: "Claude", outputType: "Writing/Personal" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "xml" },
  },
  {
    id: "p03-midjourney-landscape",
    label: "Midjourney fantasy landscape",
    input: { task: "Create a fantasy landscape image of a floating city above a stormy ocean at golden hour", role: "Personal Use", aiTool: "Midjourney/Image AI", outputType: "Image/Creative" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "image" },
  },
  {
    id: "p04-learn-spanish",
    label: "3-month Spanish learning plan",
    input: { task: "Help me learn conversational Spanish in 3 months, 30 minutes a day", role: "Student", aiTool: "Gemini", outputType: "Learning/How-To" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
  },
  {
    id: "p05-strength-program",
    label: "Beginner strength program",
    input: { task: "Build me a 3-day-a-week beginner strength training program, I only have dumbbells at home", role: "Personal Use", aiTool: "ChatGPT", outputType: "Learning/How-To" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
  },
  {
    id: "p06-novel-critique",
    label: "Novel chapter critique",
    input: { task: "Critique the opening chapter of my fantasy novel for pacing, voice, and hook", role: "Personal Use", aiTool: "Claude", outputType: "Writing/Personal" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "xml" },
  },
  {
    id: "p07-meal-prep",
    label: "Weekly meal prep plan",
    input: { task: "Create a weekly meal prep plan, high protein, under $80 of groceries, minimal cooking on weekdays", role: "Personal Use", aiTool: "ChatGPT", outputType: "Strategy/Plan" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
  },
  {
    id: "p08-marketer-vacation",
    label: "Marketer planning a personal trip (classification independence)",
    input: { task: "Plan a surprise anniversary weekend in Napa for my wife, we love food and hate crowds", role: "Marketer", aiTool: "ChatGPT", outputType: "Strategy/Plan" },
    expect: { isBusiness: false, isAgentOrAutomation: false, allowTools: false, syntax: "markdown" },
  },
];
