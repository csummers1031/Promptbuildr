"use client";

import { useEffect } from "react";

/**
 * Prompt pages are usually opened fresh from a shared link. Some mobile browsers
 * (notably iOS Chrome/Safari after app-switching) restore a stale scroll
 * position, landing mid-page with the heading tucked under the sticky header and
 * no obvious way back up. If the page loads already scrolled and there's no URL
 * hash to honor, snap to the top so the heading is visible. No-op otherwise.
 */
export default function ScrollTopOnMount() {
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    // Defer past the browser's own scroll-restoration, which can run after paint.
    const id = window.requestAnimationFrame(() => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);
  return null;
}
