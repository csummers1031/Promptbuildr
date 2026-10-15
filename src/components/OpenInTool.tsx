"use client";

import { useState } from "react";
import { aiToolLaunch } from "@/config/aiTools";

/**
 * The clear next step after generating a prompt: copy the full prompt text and
 * open the user's chosen AI tool so they can paste it immediately.
 *
 * - Chat/image tools (ChatGPT, Claude, Gemini, Midjourney, ...): one button that
 *   copies the prompt AND opens the tool's web app in a new tab. Opening the web
 *   URL deep-links into the installed app on mobile when present, else the web
 *   app, so there's never an App Store dependency.
 * - Editor tools (Cursor, GitHub Copilot): opening a website doesn't help since
 *   they paste inside their IDE, so we show a copy-only button with a hint.
 * - "Other/Any": no single destination -> render nothing (the page's own Copy
 *   button covers it).
 */
export default function OpenInTool({
  aiTool,
  promptText,
}: {
  aiTool: string;
  promptText: string;
}) {
  const launch = aiToolLaunch(aiTool);
  const [copied, setCopied] = useState(false);

  if (!launch) return null;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — the tab still opens for chat/image modes */
    }
  }

  // Editor assistants: copy only (paste happens inside the IDE).
  if (launch.mode === "editor") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          {copied ? "Copied ✓" : `Copy for ${launch.name}`}
        </button>
        <p className="text-xs text-slate-500">
          Paste it into {launch.name} in your editor.
        </p>
      </div>
    );
  }

  // Chat / image tools: copy the prompt, then open the tool in a new tab. Using
  // a real anchor keeps the affiliate rel + lets the global click tracker log it.
  const rel = launch.affiliate
    ? "sponsored noopener noreferrer"
    : "noopener noreferrer";

  return (
    <div className="flex flex-col gap-1">
      <a
        href={launch.href}
        target="_blank"
        rel={rel}
        data-track="open-in-tool"
        onClick={copyPrompt}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        {copied ? "Copied ✓ Opening…" : `Copy & open in ${launch.name}`}
        <span aria-hidden>↗</span>
      </a>
      <p className="text-xs text-slate-500">
        Copies the prompt and opens {launch.name} so you can paste it.
      </p>
    </div>
  );
}
