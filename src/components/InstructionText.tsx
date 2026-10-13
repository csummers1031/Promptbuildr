import type { InstructionSegment } from "@/lib/tools/render";

/**
 * Renders a linkified instruction step: plain text with inline tool links.
 * Every tool link is an affiliate anchor, so it carries rel="sponsored".
 * Pure presentational — safe in both server and client components.
 */
export default function InstructionText({ segments }: { segments: InstructionSegment[] }) {
  return (
    <span>
      {segments.map((s, i) =>
        s.type === "link" ? (
          <a
            key={i}
            href={s.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
          >
            {s.value}
          </a>
        ) : (
          <span key={i}>{s.value}</span>
        ),
      )}
    </span>
  );
}
