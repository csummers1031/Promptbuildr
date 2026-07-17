"use client";

import { useEffect, useState } from "react";

/**
 * Share affordances for a prompt. Uses the Web Share API when the browser
 * supports it (mobile → native share sheet), and always offers X, LinkedIn,
 * and copy-link fallbacks (desktop). Every shared URL is backed by an OG image
 * (promoted prompt pages emit a per-prompt card; the homepage/remix links emit
 * a branded default), so links unfurl nicely on social.
 *
 * `url` may be relative ("/prompts/foo") or absolute — it is resolved against
 * the current origin at click time so it works on staging and production alike.
 */
export default function ShareBar({
  url,
  title,
  text,
  variant = "full",
}: {
  url: string;
  title: string;
  text?: string;
  variant?: "full" | "compact";
}) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  function absoluteUrl(): string {
    if (/^https?:\/\//.test(url)) return url;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return origin + url;
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: absoluteUrl() });
    } catch {
      /* user cancelled or share failed — no-op */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const shareText = text ? `${text} ${title}` : title;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(absoluteUrl())}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl())}`;

  // Compact: one line, used inside feed-card action rows.
  if (variant === "compact") {
    if (canNativeShare) {
      return (
        <button
          type="button"
          onClick={nativeShare}
          className="font-medium text-slate-600 hover:text-slate-900"
        >
          Share
        </button>
      );
    }
    return (
      <span className="inline-flex items-center gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="font-medium text-slate-600 hover:text-slate-900"
        >
          {copied ? "Link copied ✓" : "Share link"}
        </button>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          className="text-slate-500 hover:text-slate-900"
        >
          <XIcon />
        </a>
        <a
          href={linkedInHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className="text-slate-500 hover:text-slate-900"
        >
          <LinkedInIcon />
        </a>
      </span>
    );
  }

  // Full: labeled bar for result view + promoted prompt pages.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">Share:</span>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <ShareIcon /> Share
        </button>
      )}
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
      >
        <XIcon /> X
      </a>
      <a
        href={linkedInHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
      >
        <LinkedInIcon /> LinkedIn
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
      >
        <LinkIcon /> {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}
