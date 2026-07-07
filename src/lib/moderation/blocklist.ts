/**
 * Hard keyword/pattern blocklist — the cheap first-pass moderation filter.
 * Runs on the raw task input BEFORE the API call (saves money on obvious junk)
 * and on generated output before publication. Nuanced judgment is the model
 * moderation verdict's job; this layer only catches unambiguous violations,
 * so patterns are deliberately narrow to limit false positives.
 */

export type BlockCategory =
  | "sexual-explicit"
  | "minors"
  | "violence-threats"
  | "hate-harassment"
  | "self-harm"
  | "illegal-drugs"
  | "illegal-weapons"
  | "illegal-fraud"
  | "illegal-hacking"
  | "third-party-pii"
  | "spam-link-injection"
  | "jailbreak";

export interface BlocklistHit {
  category: BlockCategory;
  pattern: string;
}

export interface BlocklistResult {
  blocked: boolean;
  hits: BlocklistHit[];
}

interface Rule {
  category: BlockCategory;
  re: RegExp;
}

const RULES: Rule[] = [
  // Sexual content involving minors — broadest net, zero tolerance
  { category: "minors", re: /\b(child|underage|minor|preteen|loli|shota)\b[^.]{0,60}\b(sex|sexual|nude|naked|porn|explicit|erotic)\b/i },
  { category: "minors", re: /\b(sex|sexual|nude|naked|porn|explicit|erotic)\b[^.]{0,60}\b(child|children|underage|minor|preteen)\b/i },

  // Sexually explicit
  { category: "sexual-explicit", re: /\b(porn|pornographic|xxx[- ]rated|hardcore sex|explicit sex(ual)? (scene|story|content|roleplay))\b/i },
  { category: "sexual-explicit", re: /\b(erotic (story|roleplay|fiction|chat)|nsfw (story|image|content|roleplay))\b/i },

  // Violence / threats
  { category: "violence-threats", re: /\b(how to (kill|murder|assassinate|torture)|kill (my|his|her|their) (wife|husband|boss|neighbor|ex))\b/i },
  { category: "violence-threats", re: /\b(threat(en(ing)?)? to (kill|hurt|harm|bomb)|plan (a|an) (shooting|bombing|attack on))\b/i },

  // Hate / harassment
  { category: "hate-harassment", re: /\b(gas the|exterminate the|ethnic cleansing|racial slur(s)? (for|about)|why (jews|blacks|muslims|immigrants|gays) are (inferior|subhuman|vermin))\b/i },
  { category: "hate-harassment", re: /\b(harass(ment)? campaign|dox(x)?(ing)? (him|her|them|someone)|cyberbully(ing)?)\b/i },

  // Self-harm
  { category: "self-harm", re: /\b(how to (commit suicide|kill myself|self[- ]harm)|painless (way|method) to die|suicide (method|note that))\b/i },

  // Illegal: drugs
  { category: "illegal-drugs", re: /\b(how to (make|cook|synthesize|manufacture) (meth|fentanyl|heroin|cocaine|mdma|lsd)|buy (illegal )?drugs online)\b/i },

  // Illegal: weapons
  { category: "illegal-weapons", re: /\b(build (a|an) (bomb|pipe bomb|explosive|ghost gun)|3d[- ]print(ed)? (gun|firearm)|untraceable (gun|firearm|weapon))\b/i },

  // Illegal: fraud
  { category: "illegal-fraud", re: /\b(phishing (email|page|campaign|kit)|steal (credit card|identity|passwords)|fake (invoice|id|passport|documents) (scam|to defraud)|launder(ing)? money|ponzi scheme (script|pitch))\b/i },

  // Illegal: hacking (offensive intent markers, not the word "hack" alone —
  // "Hacking Demand" and growth-hacking are legitimate)
  { category: "illegal-hacking", re: /\b(hack into (a|an|my ex|someone|her|his|their)|break into (a|an|someone).{0,30}(account|email|phone|network)|bypass (2fa|two[- ]factor|authentication) (on|for) (someone|a victim)|ransomware|keylogger|credential stuffing|sql injection attack on)\b/i },

  // Spam / link injection
  { category: "spam-link-injection", re: /\b(mass (spam|unsolicited) (email|dm|message)s?|buy backlinks|link farm)\b/i },
  { category: "spam-link-injection", re: /(https?:\/\/[^\s]+){4,}/i },

  // Jailbreak / extraction attempts
  { category: "jailbreak", re: /\b(ignore (all|your|previous|prior) (instructions|rules|guidelines)|jailbreak (prompt|chatgpt|claude|gemini)|dan mode|do anything now|without (any )?(safety|ethical) (filters|restrictions|guidelines)|bypass (content|safety) (filter|policy|moderation))\b/i },
];

// Third-party PII — only applied to PUBLIC-FACING text (title/prompt/instructions),
// not the raw task input, since users legitimately type their own emails.
const PII_RULES: Rule[] = [
  { category: "third-party-pii", re: /[a-zA-Z0-9._%+-]+@(?!example\.com|yourcompany\.com|company\.com|domain\.com|email\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { category: "third-party-pii", re: /\b(\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/ },
];

function run(text: string, rules: Rule[]): BlocklistResult {
  const hits: BlocklistHit[] = [];
  for (const rule of rules) {
    const match = text.match(rule.re);
    if (match) hits.push({ category: rule.category, pattern: match[0].slice(0, 80) });
  }
  return { blocked: hits.length > 0, hits };
}

/** First pass on the user's raw task input, before spending API money. */
export function checkTaskInput(text: string): BlocklistResult {
  return run(text, RULES);
}

/** Pre-publication pass on generated public-facing text (includes PII rules). */
export function checkPublicText(text: string): BlocklistResult {
  return run(text, [...RULES, ...PII_RULES]);
}
