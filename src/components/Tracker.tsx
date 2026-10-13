"use client";

import { useEffect } from "react";

/**
 * First-party attribution beacon. On load, reports the landing visit (referrer
 * + utm) so we can classify source/AI/term server-side. Also listens globally
 * for clicks on any <a data-track="..."> (affiliate + CTA links) and reports
 * them. Fully fail-safe — never throws, never blocks. Fires once per full page
 * load (it lives in the layout, so client-side route changes don't re-fire).
 */
export default function Tracker() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams;
      const body = JSON.stringify({
        path: url.pathname,
        referrer: document.referrer || null,
        utm: {
          source: p.get("utm_source"),
          medium: p.get("utm_medium"),
          campaign: p.get("utm_campaign"),
          term: p.get("utm_term"),
          content: p.get("utm_content"),
        },
      });
      send("/api/track/visit", body);
    } catch {
      /* ignore */
    }

    function onClick(e: MouseEvent) {
      try {
        const target = e.target as HTMLElement | null;
        const a = target?.closest?.("a[data-track]") as HTMLAnchorElement | null;
        if (!a) return;
        const body = JSON.stringify({
          href: a.href,
          label: (a.textContent || "").trim().slice(0, 120),
          placement: a.getAttribute("data-track"),
          path: window.location.pathname,
        });
        send("/api/track/click", body);
      } catch {
        /* ignore */
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

function send(url: string, body: string) {
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
  } catch {
    /* fall through */
  }
  try {
    void fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
