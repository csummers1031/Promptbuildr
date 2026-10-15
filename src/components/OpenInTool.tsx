"use client";

import { useState } from "react";
import { aiToolLaunch, type AiToolLaunch } from "@/config/aiTools";

/**
 * The clear next step after generating a prompt: copy the full prompt text and
 * open the user's chosen AI tool so they can paste it.
 *
 * - A specific chat/image tool (ChatGPT, Claude, Gemini, Midjourney, ...): one
 *   button that copies the prompt AND opens the tool's web app in a new tab. The
 *   web URL deep-links into the installed app on mobile when present, else the
 *   web app, so there's never an App Store dependency.
 * - Editor tools (Cursor, GitHub Copilot): opening a website doesn't help since
 *   they paste inside their IDE, so we show a copy-only button with a hint.
 * - "Other/Any" (no single destination): a small chooser so the user can still
 *   copy + open one of the popular assistants in one tap.
 */

// Shown for "Other/Any", where the user didn't commit to one tool.
const CHOOSER = ["ChatGPT", "Claude", "Gemini"];

export default function OpenInTool({
  aiTool,
  promptText,
}: {
  aiTool: string;
  promptText: string;
}) {
  const launch = aiToolLaunch(aiTool);
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — the tab still opens for chat/image modes */
    }
  }

  // No single destination (Other/Any): offer a few popular assistants.
  if (!launch) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Copy &amp; open in
        </span>
        <div className="flex flex-wrap gap-2">
          {CHOOSER.map((name) => {
            const l = aiToolLaunch(name);
            if (!l) return null;
            return <LaunchLink key={name} launch={l} onCopy={copyPrompt} copied={copied} compact />;
          })}
        </div>
      </div>
    );
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
        <p className="text-xs text-slate-500">Paste it into {launch.name} in your editor.</p>
      </div>
    );
  }

  // Chat / image tools: copy then open the tool in a new tab.
  return (
    <div className="flex flex-col gap-1">
      <LaunchLink launch={launch} onCopy={copyPrompt} copied={copied} />
      <p className="text-xs text-slate-500">
        Copies the prompt and opens {launch.name} so you can paste it.
      </p>
    </div>
  );
}

/**
 * A single "copy + open" anchor. Using a real anchor keeps the affiliate rel and
 * lets the global click tracker log it; the onClick copies before navigation.
 */
function LaunchLink({
  launch,
  onCopy,
  copied,
  compact = false,
}: {
  launch: AiToolLaunch;
  onCopy: () => void;
  copied: boolean;
  compact?: boolean;
}) {
  const rel = launch.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-sm transition bg-indigo-600 hover:bg-indigo-700";
  const size = compact ? "px-3.5 py-2 text-sm" : "px-5 py-2.5 text-sm";
  return (
    <a
      href={launch.href}
      target="_blank"
      rel={rel}
      data-track="open-in-tool"
      onClick={onCopy}
      className={`${base} ${size}`}
    >
      {compact ? launch.name : copied ? "Copied ✓ Opening…" : `Copy & open in ${launch.name}`}
      <span aria-hidden>↗</span>
    </a>
  );
}
