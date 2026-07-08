"use client";

import { useState } from "react";
import { ROLES } from "@/config/constants";

/**
 * Email + role capture shown after the free generation is used. On success it
 * calls onUnlocked() so the builder can retry the pending generation.
 */
export default function EmailGate({
  message,
  defaultRole,
  onUnlocked,
}: {
  message: string;
  defaultRole: string;
  onUnlocked: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Enter your email.");
    if (!role) return setError("Pick your role.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      onUnlocked();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">Keep generating — free</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          disabled={submitting}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={submitting}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        >
          <option value="">Select your role…</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70"
        >
          {submitting ? "Unlocking…" : "Unlock unlimited prompts"}
        </button>
        <p className="text-center text-xs text-slate-400">
          No spam. We'll send the occasional best-of-prompts email; unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
