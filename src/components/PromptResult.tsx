"use client";

import { useEffect, useRef, useState } from "react";
import type { PresentedGeneration } from "@/lib/clientTypes";
import ShareBar from "./ShareBar";
import InstructionText from "./InstructionText";
import OpenInTool from "./OpenInTool";

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${className}`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function PromptResult({
  data,
  blockedMessage,
  onRemix,
  share,
}: {
  data: PresentedGeneration;
  blockedMessage?: string;
  onRemix?: () => void;
  share?: { url: string; title: string; text?: string };
}) {
  const linkableTools = data.toolLinks.filter((t) => t.href);
  const rootRef = useRef<HTMLDivElement>(null);

  // The result replaces the builder form, which sat lower on the page (the user
  // just tapped "Generate" near the bottom). Without this the result's heading
  // is above the current scroll position and the user has to hunt for it. Bring
  // the heading to the top once, after paint. scroll-mt keeps it clear of the
  // sticky header.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={rootRef} className="flex scroll-mt-24 flex-col gap-6">
      {blockedMessage && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {blockedMessage}
        </div>
      )}

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{data.title}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.categoryTags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Prompt first, big and copyable */}
      <section aria-label="Generated prompt">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {data.aiTool === "Other/Any" ? "Your prompt" : `Your prompt for ${data.aiTool}`}
          </h3>
          <CopyButton text={data.prompt} className="bg-indigo-600 text-white hover:bg-indigo-700" />
        </div>
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800">
          {data.prompt}
        </pre>

        {/* Clear next step: copy the prompt and open the chosen AI tool, or
            remix the same inputs. */}
        <div className="mt-3 flex flex-col gap-2.5">
          <OpenInTool aiTool={data.aiTool} promptText={data.prompt} />
          {onRemix && (
            <button
              type="button"
              onClick={onRemix}
              className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              <span aria-hidden>↻</span> Remix — edit your inputs
            </button>
          )}
        </div>

        {share && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <ShareBar url={share.url} title={share.title} text={share.text} variant="full" />
            {share.url.startsWith("/prompts/") && (
              <p className="mt-2 text-xs text-slate-500">
                Your prompt now has its own page, shared links open{" "}
                <a
                  href={share.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-800"
                >
                  the full prompt ↗
                </a>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Instructions second, with inline tool links */}
      <section aria-label="Setup instructions">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">How to use it</h3>
        <ol className="flex flex-col gap-2.5">
          {data.instructions.map((segments, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {i + 1}
              </span>
              <InstructionText segments={segments} />
            </li>
          ))}
        </ol>
      </section>

      {/* Tool links (business only; personal returns none) */}
      {linkableTools.length > 0 && (
        <section aria-label="Recommended tools">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended tools</h3>
          <div className="flex flex-wrap gap-2">
            {linkableTools.map((t) => (
              <a
                key={t.name}
                href={t.href!}
                target="_blank"
                rel="sponsored noopener noreferrer"
                data-track="tool-chip"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
              >
                {t.name}
                <span aria-hidden className="text-slate-400">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Conditional service CTA (business + automation / demand-gen) */}
      {data.cta && (
        <section
          className={`rounded-xl border p-5 ${
            data.cta.kind === "agent-build"
              ? "border-indigo-200 bg-indigo-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <h3 className="text-base font-semibold text-slate-900">{data.cta.heading}</h3>
          <p className="mt-1 text-sm text-slate-600">{data.cta.body}</p>
          <a
            href={data.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            data-track="cta"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {data.cta.ctaLabel}
            <span aria-hidden>→</span>
          </a>
        </section>
      )}

    </div>
  );
}
