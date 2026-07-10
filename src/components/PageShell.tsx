import Link from "next/link";
import Footer from "@/components/Footer";

/** Simple header+footer shell for static content pages. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Prompt<span className="text-indigo-600">buildr</span>
        </Link>
        <Link href="/prompts" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          Browse feed
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
      <Footer />
    </div>
  );
}
