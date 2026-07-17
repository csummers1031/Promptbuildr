"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedPrompt } from "@/lib/feed/types";
import ShareBar from "@/components/ShareBar";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default function FeedCard({ prompt }: { prompt: FeedPrompt }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [votes, setVotes] = useState(prompt.upvoteCount);
  const [voted, setVoted] = useState(false);
  const [reported, setReported] = useState(false);

  const remixHref =
    `/?remix=1&task=${encodeURIComponent(prompt.title)}` +
    `&role=${encodeURIComponent(prompt.role)}` +
    `&aiTool=${encodeURIComponent(prompt.aiTool)}` +
    `&outputType=${encodeURIComponent(prompt.outputType)}`;

  // Promoted prompts have a canonical page (with a per-prompt OG image); share
  // that. Others fall back to a pre-filled builder link.
  const shareHref = prompt.slug ? `/prompts/${prompt.slug}` : remixHref;

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function upvote() {
    if (voted) return;
    setVoted(true);
    setVotes((v) => v + 1); // optimistic
    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id }),
      });
      if (!res.ok) {
        setVoted(false);
        setVotes((v) => v - 1);
      }
    } catch {
      setVoted(false);
      setVotes((v) => v - 1);
    }
  }

  async function report() {
    if (reported) return;
    setReported(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, reason: "user-report" }),
      });
    } catch {
      /* best effort */
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {prompt.slug ? (
              <Link href={`/prompts/${prompt.slug}`} className="hover:text-indigo-700">
                {prompt.title}
              </Link>
            ) : (
              prompt.title
            )}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag>{prompt.role}</Tag>
            <Tag>{prompt.aiTool}</Tag>
            <Tag>{prompt.outputType}</Tag>
          </div>
        </div>
        <button
          type="button"
          onClick={upvote}
          disabled={voted}
          aria-label="Upvote"
          className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1 text-sm font-semibold transition ${
            voted
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          <span aria-hidden>▲</span>
          <span className="tabular-nums">{votes}</span>
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {expanded ? null : truncate(prompt.promptText, 180)}
      </p>

      {expanded && (
        <div className="mt-2 flex flex-col gap-3">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800">
            {prompt.promptText}
          </pre>
          {prompt.instructions.length > 0 && (
            <ol className="flex flex-col gap-1.5">
              {prompt.instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="font-medium text-indigo-600 hover:text-indigo-800">
          {expanded ? "Hide" : "View prompt"}
        </button>
        <button type="button" onClick={copy} className="font-medium text-slate-600 hover:text-slate-900">
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <Link href={remixHref} className="font-medium text-slate-600 hover:text-slate-900">
          Remix
        </Link>
        <ShareBar
          url={shareHref}
          title={`${prompt.title} — a ready-to-use ${prompt.aiTool} prompt`}
          text="Found this AI prompt on Promptbuildr:"
          variant="compact"
        />
        <span className="text-slate-400">{prompt.viewCount} views</span>
        <button
          type="button"
          onClick={report}
          disabled={reported}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600 disabled:opacity-60"
        >
          {reported ? "Reported" : "Report"}
        </button>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{children}</span>
  );
}
