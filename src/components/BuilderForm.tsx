"use client";

import { useEffect, useState } from "react";
import { ROLES, AI_TOOLS, OUTPUT_TYPES } from "@/config/constants";
import type { GenerateResponse } from "@/lib/clientTypes";
import PromptResult from "./PromptResult";

const PLACEHOLDERS = [
  "Write cold outbound emails for a SaaS demo offer",
  "Plan a 7-day Italy trip on a budget",
  "Build an agent that triages support tickets",
  "Write a best man speech, funny but heartfelt",
  "Create a 30-day LinkedIn content calendar",
  "Help me learn conversational Spanish in 3 months",
  "Draft a PRD for usage-based billing",
  "Design a Midjourney prompt for a fantasy landscape",
];

type State =
  | { phase: "form" }
  | { phase: "loading" }
  | { phase: "result"; data: GenerateResponse };

export default function BuilderForm() {
  const [task, setTask] = useState("");
  const [role, setRole] = useState<string>("");
  const [aiTool, setAiTool] = useState<string>("Claude");
  const [outputType, setOutputType] = useState<string>("");
  const [state, setState] = useState<State>({ phase: "form" });
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (task) return; // stop rotating once the user types
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(id);
  }, [task]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!task.trim()) return setError("Tell us what you're trying to do.");
    if (!role) return setError("Pick who you are.");
    if (!outputType) return setError("Pick a desired output type.");

    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), role, aiTool, outputType }),
      });
      const data: GenerateResponse = await res.json();
      if (data.status === "error") {
        setError(data.message || "Something went wrong. Please try again.");
        setState({ phase: "form" });
        return;
      }
      setState({ phase: "result", data });
    } catch {
      setError("Network error. Please try again.");
      setState({ phase: "form" });
    }
  }

  function reset() {
    setState({ phase: "form" });
    setError(null);
  }

  if (state.phase === "result") {
    const d = state.data;
    if (d.status === "ok") {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <PromptResult data={d.result} onRemix={reset} />
        </div>
      );
    }
    if (d.status === "blocked") {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {d.result ? (
            <PromptResult data={d.result} blockedMessage={d.message} onRemix={reset} />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-amber-900">{d.message}</p>
              <button type="button" onClick={reset} className="self-start text-sm font-medium text-slate-500 underline">
                ← Try another prompt
              </button>
            </div>
          )}
        </div>
      );
    }
    // error should have been handled before entering the result phase
    return null;
  }

  const loading = state.phase === "loading";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="task" className="mb-1.5 block text-sm font-semibold text-slate-700">
            What are you trying to do?
          </label>
          <textarea
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={3}
            maxLength={1000}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Who are you?">
            <Select id="role" value={role} onChange={setRole} disabled={loading} placeholder="Select…" options={ROLES} />
          </Field>
          <Field label="Which AI tool?">
            <Select id="aiTool" value={aiTool} onChange={setAiTool} disabled={loading} options={AI_TOOLS} />
          </Field>
          <Field label="Desired output">
            <Select id="outputType" value={outputType} onChange={setOutputType} disabled={loading} placeholder="Select…" options={OUTPUT_TYPES} />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Spinner /> Building your prompt…
            </>
          ) : (
            "Generate my prompt"
          )}
        </button>
        <p className="text-center text-xs text-slate-400">
          Free. No signup needed for your first prompt.
        </p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
  );
}
