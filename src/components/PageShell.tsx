import Link from "next/link";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

/** Simple header+footer shell for static content pages. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" aria-label="Promptbuildr home">
          <Logo />
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
