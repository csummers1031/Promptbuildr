/**
 * Promptbuildr brand lockup: the P-bubble caret mark + wordmark.
 * The mark is a speech bubble whose silhouette reads as a "P", with a ">"
 * chevron knocked out (shows the page background through it). Indigo #4F46E5.
 */
const MARK =
  "M20 8 H44 A14 14 0 0 1 58 22 V34 A14 14 0 0 1 44 48 H16 L9 55 Q6 58 6 54 V22 A14 14 0 0 1 20 8 Z " +
  "M29.621 17.879 L37.621 25.879 A3 3 0 0 1 37.621 30.121 L29.621 38.121 A3 3 0 0 1 25.379 33.879 L31.257 28 L25.379 22.121 A3 3 0 0 1 29.621 17.879 Z";

export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <path fill="#4F46E5" fillRule="evenodd" d={MARK} />
      </svg>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Prompt<span className="text-indigo-600">buildr</span>
      </span>
    </span>
  );
}
