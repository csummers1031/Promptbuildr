// Seed wave 4: the final wave of the phased 40-prompt launch plan.
// Appends 10 new prompts (7 business / 3 personal) to scripts/seed-data.json.
// Guards: no em-dash / en-dash anywhere; every registrySlug must exist in
// src/config/tools.data.json; no duplicate title or slug vs the existing corpus.
// Run: node scripts/seed-wave-4.mjs   (or: pnpm exec tsx scripts/seed-wave-4.mjs)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = resolve(__dirname, "seed-data.json");
const TOOLS_PATH = resolve(__dirname, "../src/config/tools.data.json");

const NEW_ENTRIES = [
  // ===== BUSINESS (7) =====
  {
    slug: "write-high-converting-pricing-page-copy-for-a-saas-product",
    title: "Write high-converting pricing page copy for a SaaS product",
    promptText: `Before you begin, ask me for the key specifics you need: (1) my product and the core outcome it delivers, (2) my pricing tiers with the price and the headline value of each, and (3) who the buyer is and the single biggest objection that stalls them. If I do not answer, make reasonable assumptions, state them at the top, and proceed.

<role>
You are a senior conversion copywriter who specializes in SaaS pricing pages. You write with clarity, you lead with value, and you remove friction instead of adding hype.
</role>

<task>
Write complete pricing page copy that makes the right plan obvious in seconds, answers the buyer's real objections, and moves them to start or upgrade.
</task>

<context>
- Product and core outcome: [PRODUCT_AND_OUTCOME]
- Pricing tiers: [TIER_NAMES, PRICES, AND HEADLINE VALUE OF EACH]
- Buyer and biggest objection: [WHO_BUYS] and [THE_OBJECTION_THAT_STALLS_THEM]
- Billing details to reflect: [MONTHLY_VS_ANNUAL, FREE_TRIAL_OR_FREEMIUM, MONEY_BACK_OR_NONE]
</context>

<constraints>
- Benefit-led, not a feature dump. Every plan name and line should signal who it is for and what they get.
- No hype words and no fake scarcity. Do not invent testimonials, logos, or statistics.
- Keep it scannable: short plan descriptions, scannable feature rows, and one clear primary action per tier.
</constraints>

<output_format>
Return: (1) a page headline and subhead, (2) a short value line and a one-sentence description for each tier with its CTA button text, (3) a recommended "most popular" tag and why, (4) a feature comparison outline grouped by theme, and (5) a 5-question FAQ block that defuses the top objections. End with 2 alternate headline options.
</output_format>`,
    instructions: [
      "Open Claude and paste the full prompt, then answer the three questions it asks so the copy matches your real plans and buyer.",
      "Review the tier value lines and CTAs. Ask Claude to tighten any plan description that runs long or sounds generic.",
      "Build the page layout in Figma (or your design tool) and drop the headline, tier cards, comparison table, and FAQ into place so you can see the hierarchy.",
      "Publish or stage the page, then set up Hotjar to record sessions and heatmaps so you can see where visitors hesitate on the pricing table.",
      "After a week of traffic, feed Hotjar findings back to Claude (for example \"visitors drop at the annual toggle\") and ask it to rewrite the weak section, then test the new version.",
    ],
    recommendedTools: [
      { name: "Figma", normalized: "figma", registrySlug: "figma", homepageUrl: null },
      { name: "Hotjar", normalized: "hotjar", registrySlug: "hotjar", homepageUrl: null },
    ],
    categoryTags: ["copywriting", "pricing", "conversion"],
    role: "Marketer",
    aiTool: "Claude",
    outputType: "Content/Copy",
    taskInput: "Write high-converting pricing page copy for my SaaS product",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "build-a-competitive-sales-battlecard-for-your-reps",
    title: "Build a competitive sales battlecard for your reps",
    promptText: `Before you begin, ask me for the key specifics you need: (1) my product and the one competitor this battlecard is about, (2) the deals where we win and the deals where we lose to them, and (3) who uses this card and in what moment (a live call, a follow-up email, a deal review). If I do not answer, make reasonable assumptions, state them at the top, and proceed.

<role>
You are a product marketing lead who builds sales enablement that reps actually use. You are honest about weaknesses, specific about proof, and you never put words in a rep's mouth that they cannot defend.
</role>

<task>
Build a one-page competitive battlecard a rep can scan mid-call to position us against one named competitor and handle their strongest talking points.
</task>

<context>
- My product and the competitor: [MY_PRODUCT] versus [COMPETITOR]
- Where we win and where we lose: [WIN_SCENARIOS] and [LOSS_SCENARIOS]
- Who uses the card and when: [REP_ROLE] during [THE_MOMENT]
- Verifiable proof I can share: [CASE_STUDIES, NUMBERS, OR FEATURES I CAN BACK UP]
</context>

<constraints>
- Do not fabricate competitor pricing, features, or customer counts. When a claim needs real data, tell me to confirm it from the competitor site or a tool like Semrush and add a clearly labeled [VERIFY] note.
- Stay honest and defensible. For each of our weak spots, give a truthful reframe, not spin.
- Keep every talking point short enough to read while someone is talking.
</constraints>

<output_format>
Return a single-page card with: (1) a one-line positioning statement, (2) "why we win" in 3 bullets, (3) "watch out for" (their strengths) in 3 bullets, (4) a trap-setting question to plant doubt fairly, (5) objection and response pairs for their top 3 talking points, and (6) a short landmine list of things not to say. Mark any claim that needs confirmation with [VERIFY].
</output_format>`,
    instructions: [
      "Open Claude and paste the prompt, then answer its questions with real win and loss stories so the card reflects how deals actually go.",
      "Use Clay to pull firmographic and tech-stack data on the competitor's typical customers, and Semrush to see the keywords and messaging they lead with, so your positioning is grounded in facts.",
      "Paste that research back into the chat and resolve every [VERIFY] note, replacing assumptions with confirmed numbers or cutting claims you cannot back up.",
      "Share a draft with two reps who sell against this competitor and ask what is missing from the objection responses, then have Claude incorporate their edits.",
      "Save the final card where reps work (CRM, Notion, or Slack) and schedule a quick refresh each quarter as the competitor changes.",
    ],
    recommendedTools: [
      { name: "Clay", normalized: "clay", registrySlug: "clay", homepageUrl: null },
      { name: "Semrush", normalized: "semrush", registrySlug: "semrush", homepageUrl: null },
    ],
    categoryTags: ["sales-enablement", "competitive-analysis", "battlecard"],
    role: "Sales/SDR",
    aiTool: "Claude",
    outputType: "Analysis/Research",
    taskInput: "Build a competitive sales battlecard for my reps",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "draft-a-winning-rfp-response-from-a-request-document",
    title: "Draft a winning RFP response from a request document",
    promptText: `Before you begin, ask me for the key specifics you need: (1) the RFP questions or requirements I need to answer (paste them in), (2) my company and the specific solution I am proposing, and (3) what matters most to this buyer and why they issued the RFP. If I do not answer, make reasonable assumptions, state them at the top, and proceed.

<role>
You are a proposal writer who has won competitive RFPs for B2B companies. You answer the question that was asked, you prove claims with evidence, and you make a busy evaluator's job easy.
</role>

<task>
Draft clear, persuasive answers to an RFP so each response directly addresses the requirement, differentiates us, and scores well against the buyer's criteria.
</task>

<context>
- RFP questions or requirements: [PASTE_THE_RFP_ITEMS]
- My company and proposed solution: [COMPANY_AND_SOLUTION]
- What the buyer cares about most: [PRIORITIES_AND_WHY_THEY_ISSUED_THE_RFP]
- Proof I can use: [CASE_STUDIES, CERTIFICATIONS, METRICS, OR REFERENCES]
</context>

<constraints>
- Answer each requirement on its own terms. Do not pad with marketing language that does not address the question.
- Never invent certifications, client names, security attestations, or numbers. Where a fact is needed and I have not given it, insert a clearly labeled [CONFIRM] placeholder.
- Match the buyer's language and scoring priorities, and keep each answer tight enough for a reviewer to score quickly.
</constraints>

<output_format>
For each requirement return: the requirement restated in one line, a direct answer, the proof point that supports it, and one differentiator sentence. Then provide a short executive summary I can place at the top and a list of every [CONFIRM] placeholder I still need to fill before submission.
</output_format>`,
    instructions: [
      "Open Claude and paste the full RFP text where the prompt asks for the requirements, then answer its questions about your solution and the buyer.",
      "Keep a reusable answer library in Notion (security, implementation, pricing, support) so you can paste in approved boilerplate and have Claude tailor it to this specific RFP.",
      "Go through every [CONFIRM] placeholder and replace it with a verified fact, pulling from your real certifications, case studies, and references.",
      "Run the full draft through QuillBot to tighten wording and keep a consistent, professional tone across answers written at different times.",
      "Have a subject-matter expert review the technical and legal answers, then assemble the final document in your required format and submit before the deadline.",
    ],
    recommendedTools: [
      { name: "Notion", normalized: "notion", registrySlug: "notion", homepageUrl: null },
      { name: "QuillBot", normalized: "quillbot", registrySlug: "quillbot", homepageUrl: null },
    ],
    categoryTags: ["proposals", "rfp", "b2b-sales"],
    role: "Sales/SDR",
    aiTool: "Claude",
    outputType: "Content/Copy",
    taskInput: "Draft a winning RFP response from a request document",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "webinar-promotion-and-registration-email-sequence",
    title: "Write a webinar promotion and registration email sequence",
    promptText: `# Before you begin
Ask me for the key specifics you need: (1) the webinar topic, date and time, and the one outcome attendees will walk away with, (2) who I am inviting and how warm they are to my brand, and (3) the registration link and any speaker or guest worth featuring. If I do not answer, make reasonable assumptions, state them at the top, and proceed.

# Task
Write a complete email sequence that fills a webinar: it should build interest, drive registrations, and reduce no-shows for [WEBINAR_TOPIC].

# Context
- Webinar topic, date, and promise: [TOPIC], [DATE_AND_TIME], [THE_ONE_THING_THEY_LEARN]
- Audience: [WHO_IS_INVITED_AND_RELATIONSHIP_TO_BRAND]
- Registration link and speakers: [REGISTRATION_URL] and [SPEAKER_OR_GUEST]
- Timeline before the event: [HOW_MANY_DAYS_OUT_I_AM_STARTING]

# Constraints
- Lead with the attendee outcome, not the agenda. Make the value obvious in the subject line and first sentence.
- One clear CTA per email (register, or join now), with a short, honest reason to attend. No hype and no fake scarcity, though a genuine "seats or replay" note is fine.
- Do not invent speaker credentials, attendee counts, or quotes.

# Output Format
Provide a 5-email sequence: (1) announcement, (2) value and agenda, (3) speaker or social proof, (4) day-before reminder, (5) one-hour-before "we are starting" email. For each give 3 subject line options, preview text, and the body with CTA button text. Add a short post-webinar follow-up email for attendees and one for no-shows with the replay.`,
    instructions: [
      "Paste the prompt into ChatGPT and answer its opening questions so every email points to your real date, promise, and registration link.",
      "Pick the strongest subject line for each send and review the bodies. Ask ChatGPT to adjust tone or trim any email that feels long.",
      "Build the emails in HubSpot and design them in Beefree so the CTA button and registration link stand out and render well on mobile.",
      "Set up the sends on a schedule in HubSpot: announcement first, reminders in the final days, and the one-hour-before email timed to your start.",
      "After the webinar, send the attendee follow-up and the no-show replay email, then check open and click rates to see which subject lines drove the most registrations.",
    ],
    recommendedTools: [
      { name: "HubSpot", normalized: "hubspot", registrySlug: "hubspot", homepageUrl: null },
      { name: "Beefree", normalized: "beefree", registrySlug: "beefree", homepageUrl: null },
    ],
    categoryTags: ["email-marketing", "webinar", "demand-generation"],
    role: "Marketer",
    aiTool: "ChatGPT",
    outputType: "Email/Outreach",
    taskInput: "Write a webinar promotion and registration email sequence",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "write-a-linkedin-thought-leadership-post-that-builds-authority",
    title: "Write a LinkedIn thought-leadership post that builds authority",
    promptText: `# Before you begin
Ask me for the key specifics you need: (1) the point of view or lesson I want to share and the real story or data behind it, (2) who I want to reach and what I want them to think or do after reading, and (3) my voice (plain and direct, warm, contrarian) and anything I never say. If I do not answer, make reasonable assumptions, state them at the top, and proceed.

# Task
Write a single long-form LinkedIn post that shares a genuine point of view, earns trust from [TARGET_AUDIENCE], and reads like a real person wrote it.

# Context
- My point of view and the story behind it: [THE_LESSON] and [THE_REAL_EXPERIENCE_OR_DATA]
- Who I want to reach and the takeaway: [AUDIENCE] and [WHAT_THEY_SHOULD_THINK_OR_DO]
- My voice and no-go list: [VOICE] and [WORDS_OR_CLAIMS_TO_AVOID]

# Constraints
- Open with a hook that earns the second line. No "I am excited to announce" and no engagement-bait questions.
- Specific over generic: use the real story, numbers, or moment I gave you, and never invent facts about me.
- Short lines and white space for mobile reading. One idea, not a listicle of ten.
- No hashtag stuffing. Suggest at most 3 relevant hashtags.

# Output Format
Provide 3 hook options, then the full post built on the strongest hook, with a clear takeaway and a soft closing line that invites a genuine reply. Add a one-line note on the best time of day to post it and 3 optional hashtags. Keep it under 250 words unless the story needs more.`,
    instructions: [
      "Paste the prompt into ChatGPT and answer its questions with a real story, number, or moment. The more specific and true the detail, the stronger the post.",
      "Choose the hook that sounds most like you, then read the post out loud. Ask ChatGPT to cut any line that sounds like a press release.",
      "Draft two or three variations with Rytr so you can A/B different angles, then pick the version that feels most authentic.",
      "Run the final text through QuillBot to tighten phrasing and remove filler while keeping your voice.",
      "Post it at the suggested time, reply to every early comment to build momentum, and save the hooks that performed best as templates for next time.",
    ],
    recommendedTools: [
      { name: "Rytr", normalized: "rytr", registrySlug: "rytr", homepageUrl: null },
      { name: "QuillBot", normalized: "quillbot", registrySlug: "quillbot", homepageUrl: null },
    ],
    categoryTags: ["linkedin", "personal-brand", "content-marketing"],
    role: "Founder/CEO",
    aiTool: "ChatGPT",
    outputType: "Content/Copy",
    taskInput: "Write a LinkedIn thought-leadership post that builds authority",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "turn-a-podcast-episode-into-show-notes-and-repurposed-clips",
    title: "Turn a podcast episode into show notes and repurposed clips",
    promptText: `Before you begin, ask me for the key specifics you need: (1) the episode transcript or a detailed summary (paste it in), (2) the show name, episode title, guest, and where listeners should go next, and (3) the platforms I want to repurpose for (for example YouTube, LinkedIn, a newsletter). If I do not answer, make reasonable assumptions, state them at the top, and proceed.

<role>
You are a podcast producer and content strategist who turns one recording into a week of assets without losing the guest's actual meaning.
</role>

<task>
Turn one podcast episode into publish-ready show notes plus a set of repurposed clips and posts, all drawn from what was really said.
</task>

<context>
- Episode material: [PASTE_TRANSCRIPT_OR_DETAILED_SUMMARY]
- Show details: [SHOW_NAME], [EPISODE_TITLE], [GUEST], and [CALL_TO_ACTION]
- Platforms to repurpose for: [PLATFORMS]
</context>

<constraints>
- Use only what is in the transcript. Do not invent quotes, stats, or claims the guest did not make.
- Quotes must be verbatim. If you paraphrase, label it clearly as a paraphrase.
- Match each platform's format and length, and keep timestamps accurate if they appear in the source.
</constraints>

<output_format>
Return: (1) an SEO-friendly episode title and description, (2) a bulleted show-notes summary with timestamped chapter markers, (3) 5 pull quotes suitable for audiograms, (4) 3 clip ideas with the start and end moment and why each stands alone, (5) a LinkedIn post and a short newsletter blurb, and (6) 5 suggested tags. Flag anything you could not verify from the transcript.
</output_format>`,
    instructions: [
      "In Descript, transcribe the episode and paste the transcript into Claude where the prompt asks for it, so every asset is built from the real recording.",
      "Review the show notes and chapter markers against the audio, correcting any timestamp that drifted.",
      "Use the 3 clip ideas to cut short videos in Descript, trimming to the start and end moments Claude identified for each standalone clip.",
      "Turn the 5 pull quotes into audiograms, and use ElevenLabs if you want a clean voiceover intro or an audio teaser for the episode.",
      "Schedule the LinkedIn post and newsletter blurb, publish the show notes on your episode page, and track which clip drove the most listens back to the full episode.",
    ],
    recommendedTools: [
      { name: "Descript", normalized: "descript", registrySlug: "descript", homepageUrl: null },
      { name: "ElevenLabs", normalized: "elevenlabs", registrySlug: "elevenlabs", homepageUrl: null },
    ],
    categoryTags: ["podcasting", "content-repurposing", "creator"],
    role: "Creator/Influencer",
    aiTool: "Claude",
    outputType: "Content/Copy",
    taskInput: "Turn a podcast episode into show notes and repurposed clips",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "build-a-quarterly-business-review-deck-for-customer-success",
    title: "Build a quarterly business review deck for customer success",
    promptText: `Before you begin, ask me for the key specifics you need: (1) the customer, their goals when they bought, and the stakeholders in the room, (2) the usage, outcomes, and support data from the quarter (paste the numbers in), and (3) what I want from this QBR (a renewal, an expansion, an exec sponsor). If I do not answer, make reasonable assumptions, state them at the top, and proceed.

<role>
You are a customer success leader who runs QBRs that renew and expand accounts. You tie everything back to the customer's goals and you are honest about where value is still on the table.
</role>

<task>
Build a quarterly business review deck outline with the talking points for each slide, so I can show value delivered, align on goals, and set up the next step with [CUSTOMER].
</task>

<context>
- Customer, goals, and stakeholders: [CUSTOMER], [WHY_THEY_BOUGHT], and [WHO_IS_IN_THE_ROOM]
- This quarter's data: [USAGE, OUTCOMES, ADOPTION, SUPPORT_TICKETS, NPS, OR OTHER NUMBERS]
- My goal for the QBR: [RENEWAL, EXPANSION, EXEC_ALIGNMENT]
</context>

<constraints>
- Lead with the customer's goals and the outcomes tied to them, not a feature tour.
- Use only the real numbers I provide. Do not invent metrics; where a number is missing, add a clearly labeled [DATA] placeholder.
- Be honest about gaps or low adoption and frame each as a clear next action, not a surprise.
</constraints>

<output_format>
Return a slide-by-slide outline: title, goals recap, outcomes and ROI with the metrics, adoption and health, wins and a candid risks slide, roadmap items relevant to them, and a clear recommended next step with an ask. For each slide give a headline and 2 to 4 talking points. End with the exact [DATA] placeholders I still need to fill.
</output_format>`,
    instructions: [
      "Open Claude and paste the prompt, then answer its questions and paste in the quarter's real usage, outcome, and support numbers.",
      "Connect your product and support metrics in Databox and pull the quarter's dashboard so the ROI and adoption slides use accurate, current data.",
      "Replace every [DATA] placeholder with the real figures from Databox, and confirm the outcomes map back to the goals the customer had when they bought.",
      "Generate the deck in Gamma from Claude's slide-by-slide outline, then adjust the design so the outcomes and the recommended next step are the clearest slides.",
      "Rehearse the risks and next-step slides, send the deck after the call with the agreed actions, and log the renewal or expansion next step in your CRM.",
    ],
    recommendedTools: [
      { name: "Gamma", normalized: "gamma", registrySlug: "gamma", homepageUrl: null },
      { name: "Databox", normalized: "databox", registrySlug: "databox", homepageUrl: null },
    ],
    categoryTags: ["customer-success", "qbr", "retention"],
    role: "Customer Success",
    aiTool: "Claude",
    outputType: "Strategy/Plan",
    taskInput: "Build a quarterly business review deck for customer success",
    isBusiness: true,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },

  // ===== PERSONAL (3) =====
  {
    slug: "write-a-cover-letter-tailored-to-a-job-posting",
    title: "Write a cover letter tailored to a job posting",
    promptText: `# Before you begin
Ask me for the key specifics you need: (1) the job posting (paste it in) and the company, (2) my most relevant experience and 2 or 3 accomplishments with real numbers or results, and (3) why I want this specific role and anything I want to address (a career change, a gap, a relocation). If I do not answer, make reasonable assumptions, state them at the top, and proceed.

# Task
Write a cover letter tailored to this exact job posting that connects my experience to what they are hiring for and makes a hiring manager want to read my resume.

# Context
- Job posting and company: [PASTE_POSTING] at [COMPANY]
- My relevant experience and wins: [BACKGROUND] and [2 TO 3 ACCOMPLISHMENTS WITH RESULTS]
- Why this role and anything to address: [WHY_THIS_JOB] and [CAREER_CHANGE_GAP_OR_NONE]

# Constraints
- Mirror the language of the posting and speak to its top requirements, but do not simply restate my resume.
- Specific over generic: use my real accomplishments and numbers, and never invent titles, dates, or results.
- Keep it to one page, three or four short paragraphs, in a confident but genuine voice. No "I am writing to apply for" openings and no cliches like "team player" or "hard worker".

# Output Format
Provide the full cover letter with a strong opening line, a middle that ties 2 or 3 of my accomplishments to the role's needs, and a confident close with a clear interest in talking. Then give 2 alternate opening lines and a 2-line short version I can use as the email body when attaching my resume.`,
    instructions: [
      "Paste the job posting into ChatGPT where the prompt asks for it, then answer its questions with your real experience and specific, measurable wins.",
      "Read the draft against the posting and check that it speaks to the top two or three requirements listed, asking ChatGPT to sharpen any weak connection.",
      "Replace anything that does not sound like you with your own words, and confirm every number, title, and date is accurate.",
      "Pick the strongest opening line, keep the letter to one page, and tailor the company name and role in every place they appear.",
      "Save a master version, then reuse the prompt for each new application so every letter is tailored instead of generic.",
    ],
    recommendedTools: [],
    categoryTags: ["job-search", "cover-letter", "personal-writing"],
    role: "Personal Use",
    aiTool: "ChatGPT",
    outputType: "Writing/Personal",
    taskInput: "Write a cover letter tailored to a job posting",
    isBusiness: false,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "script-a-difficult-conversation-you-have-been-avoiding",
    title: "Script a difficult conversation you have been avoiding",
    promptText: `Before you begin, ask me for the key specifics you need: (1) who the conversation is with and our relationship, (2) what happened and what outcome I actually want from the talk, and (3) how the other person tends to react and what I am most worried about. If I do not answer, make reasonable assumptions, state them briefly, and proceed.

<role>
You are a calm, experienced communication coach. You help people say hard things clearly and kindly, without blaming and without backing down from what matters.
</role>

<task>
Help me prepare for a difficult conversation I have been avoiding, so I can walk in clear on what to say, stay steady, and move toward the outcome I want.
</task>

<context>
- Who and our relationship: [PERSON_AND_RELATIONSHIP]
- What happened and the outcome I want: [THE_SITUATION] and [WHAT_I_WANT_TO_RESOLVE]
- How they react and my worry: [THEIR_TYPICAL_REACTION] and [WHAT_I_FEAR_MOST]
</context>

<constraints>
- Help me own my part and use "I" statements. No blaming scripts, no manipulation, and no ultimatums unless I ask for one.
- Keep it realistic and human, not corporate. Short sentences I could actually say out loud.
- This is communication help, not legal, medical, or therapeutic advice. If the situation involves safety or abuse, say so and point me to a professional.
</constraints>

<output_format>
Return: (1) the one thing I most want them to hear, in a single sentence, (2) a short opening I can say to start calmly, (3) 3 key points with wording for each, (4) likely responses from them and a steady reply to each, (5) a line to use if it gets heated or I need a pause, and (6) a respectful way to close whether or not we resolve it today.
</output_format>`,
    instructions: [
      "Open Claude and paste the prompt, then answer its questions honestly, including your own part in the situation so the script is fair.",
      "Read the opening and key points out loud. Ask Claude to rewrite anything that sounds stiff or that you could not say naturally.",
      "Rehearse the likely-response replies so you are not caught off guard, and keep the pause line ready in case the conversation gets heated.",
      "Adjust the tone to fit the relationship, asking Claude to make it warmer or more direct as needed.",
      "Have the conversation in a calm, private moment, lead with the one thing you most want them to hear, and let the script guide you rather than reading it word for word.",
    ],
    recommendedTools: [],
    categoryTags: ["communication", "relationships", "personal-writing"],
    role: "Personal Use",
    aiTool: "Claude",
    outputType: "Writing/Personal",
    taskInput: "Script a difficult conversation I have been avoiding",
    isBusiness: false,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
  {
    slug: "write-a-heartfelt-letter-to-your-child-for-a-milestone",
    title: "Write a heartfelt letter to your child for a milestone",
    promptText: `Before you begin, ask me for the key specifics you need: (1) my child's name and age and the milestone this letter is for (a birthday, a graduation, a first day, a letter to open later), (2) 2 or 3 specific memories, moments, or qualities that capture who they are to me, and (3) the hopes or lessons I most want them to carry. If I do not answer, make reasonable assumptions, state them briefly, and proceed.

<role>
You are a warm, sincere writer who helps parents put real love into words without sounding like a greeting card.
</role>

<task>
Write a heartfelt letter from me to my child for a meaningful milestone that is personal, honest, and something they will keep.
</task>

<context>
- Child and milestone: [NAME_AND_AGE] for [THE_MILESTONE]
- Specific memories and qualities: [2 TO 3 REAL MOMENTS OR TRAITS THAT ARE THEM]
- Hopes or lessons to pass on: [WHAT_I_WANT_THEM_TO_CARRY]
- Tone and length: [WARM, PLAYFUL, SERIOUS] and [ABOUT_HOW_LONG]
</context>

<constraints>
- Sound like me, a parent speaking to my child, not a template. Specific memories over general praise every time.
- Use only the details I give you. Do not invent events, names, or moments.
- Warm and honest, and land on a note of love and belief in them. Avoid cliches like "the sky is the limit".
</constraints>

<output_format>
Give me the full letter with a warm opening that names the milestone, a middle built on the real memories and qualities I shared, the hopes or lessons woven in naturally, and a closing line that stays with them. Keep it to the length I asked for. Then add 2 alternate closing lines and a one-line suggestion for how to give or keep the letter.
</output_format>`,
    instructions: [
      "Open Claude and paste the prompt, then answer its questions with real, specific memories. The more concrete the moments, the more the letter will mean.",
      "Read the draft and replace anything that does not sound like your own voice with the words you would actually use.",
      "Ask Claude to adjust the tone (more playful, more serious) or the length so it fits the milestone and your child's age.",
      "Choose the closing line that moves you most, and double-check that every memory and detail is accurate.",
      "Write or print the final letter, and if it is meant to be opened later, note the date and keep it somewhere safe.",
    ],
    recommendedTools: [],
    categoryTags: ["family", "personal-writing", "letters"],
    role: "Personal Use",
    aiTool: "Claude",
    outputType: "Writing/Personal",
    taskInput: "Write a heartfelt letter to my child for a milestone",
    isBusiness: false,
    isAgentOrAutomation: false,
    promote: true,
    moderation: { verdict: "allow", reason: null },
  },
];

// ---------- load existing corpus + registry ----------
const corpus = JSON.parse(readFileSync(SEED_PATH, "utf8"));
if (!Array.isArray(corpus)) throw new Error("seed-data.json is not a JSON array");

const tools = JSON.parse(readFileSync(TOOLS_PATH, "utf8"));
const validSlugs = new Set(tools.map((t) => t.slug));

const beforeCount = corpus.length;

// ---------- guards ----------
const DASH_RE = /[—–]/; // em-dash and en-dash

function walkStrings(value, path, fn) {
  if (typeof value === "string") {
    fn(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walkStrings(v, `${path}.${k}`, fn);
  }
}

const existingTitles = new Set(corpus.map((e) => e.title.toLowerCase().trim()));
const existingSlugs = new Set(corpus.map((e) => e.slug));
const seenNewTitles = new Set();
const seenNewSlugs = new Set();

for (const entry of NEW_ENTRIES) {
  const label = entry.slug || entry.title;

  // em-dash / en-dash guard across every string field
  walkStrings(entry, label, (str, path) => {
    if (DASH_RE.test(str)) {
      throw new Error(`Em-dash or en-dash found in ${path}: ${JSON.stringify(str.slice(0, 80))}`);
    }
  });

  // registrySlug validity guard
  for (const tool of entry.recommendedTools || []) {
    if (!validSlugs.has(tool.registrySlug)) {
      throw new Error(`Unknown registrySlug "${tool.registrySlug}" in ${label} (not in tools.data.json)`);
    }
  }

  // duplicate title / slug guards (vs existing corpus and within the new batch)
  const tKey = entry.title.toLowerCase().trim();
  if (existingTitles.has(tKey)) throw new Error(`Duplicate title vs corpus: "${entry.title}"`);
  if (seenNewTitles.has(tKey)) throw new Error(`Duplicate title within new batch: "${entry.title}"`);
  if (existingSlugs.has(entry.slug)) throw new Error(`Duplicate slug vs corpus: "${entry.slug}"`);
  if (seenNewSlugs.has(entry.slug)) throw new Error(`Duplicate slug within new batch: "${entry.slug}"`);
  seenNewTitles.add(tKey);
  seenNewSlugs.add(entry.slug);
}

if (NEW_ENTRIES.length !== 10) throw new Error(`Expected 10 new entries, got ${NEW_ENTRIES.length}`);

// ---------- append + write ----------
const merged = corpus.concat(NEW_ENTRIES);
writeFileSync(SEED_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

const afterCount = merged.length;
if (afterCount - beforeCount !== 10) {
  throw new Error(`Corpus grew by ${afterCount - beforeCount}, expected 10`);
}

console.log(`OK: seed wave 4 merged. Corpus ${beforeCount} -> ${afterCount} (+${afterCount - beforeCount}).`);
console.log(`Business: ${NEW_ENTRIES.filter((e) => e.isBusiness).length}, Personal: ${NEW_ENTRIES.filter((e) => !e.isBusiness).length}`);
for (const e of NEW_ENTRIES) console.log(`  + [${e.isBusiness ? "B" : "P"}] ${e.title}`);
