"use client";

import { useEffect, useState } from "react";
import { pickLoadingOffers, type LoadingOffer } from "@/lib/offers";

/**
 * Shown while a prompt generates. Ticks through playful status steps and pops
 * in relevant affiliate offers one at a time. Offers open in a new tab so the
 * user never loses their in-progress result, and only appear for
 * business-leaning tasks (personal tasks stay ad-free).
 */
export default function GeneratingView({
  role,
  aiTool,
  outputType,
}: {
  role: string;
  aiTool: string;
  outputType: string;
}) {
  const offers = pickLoadingOffers(role, outputType);

  const steps = [
    "Analyzing your task",
    `Tuning the prompt for ${aiTool}`,
    "Adding setup instructions",
    "Polishing the wording",
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const [revealed, setRevealed] = useState(0);

  // Advance the status line on a loop while generation runs.
  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => (i + 1) % steps.length), 1100);
    return () => clearInterval(id);
  }, [steps.length]);

  // Reveal offer cards one after another.
  useEffect(() => {
    if (offers.length === 0) return;
    const id = setInterval(() => {
      setRevealed((n) => (n < offers.length ? n + 1 : n));
    }, 850);
    return () => clearInterval(id);
  }, [offers.length]);

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" aria-hidden />
        <div className="min-h-[1.5rem]" aria-live="polite">
          <span key={stepIdx} className="text-sm font-medium text-slate-600">
            {steps[stepIdx]}…
          </span>
        </div>
      </div>

      {offers.length > 0 && (
        <div className="w-full">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            While you wait — tools people use for this
          </p>
          <div className="flex flex-col gap-2.5">
            {offers.map((offer, i) => (
              <OfferCard key={offer.name} offer={offer} shown={i < revealed} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, shown }: { offer: LoadingOffer; shown: boolean }) {
  return (
    <a
      href={offer.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-500 ease-out hover:border-indigo-300 hover:shadow-md"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
        {offer.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{offer.name}</span>
        <span className="block truncate text-xs text-slate-500">{offer.description}</span>
      </span>
      <span aria-hidden className="text-slate-400">↗</span>
    </a>
  );
}
