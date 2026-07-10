import Link from "next/link";
import { HD } from "@/config/branding";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-8 text-center">
        <a
          href={HD.home}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Powered by Hacking Demand
        </a>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-500">
          <a href={HD.demandHacks} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800">Demand Hacks</a>
          <a href={HD.marketplace} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800">Discount Marketplace</a>
          <a href={HD.services} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800">Services</a>
          <a href={HD.blog} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800">Blog</a>
        </nav>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-500">
          <Link href="/prompts" className="hover:text-slate-800">Feed</Link>
          <Link href="/about" className="hover:text-slate-800">About</Link>
          <Link href="/privacy" className="hover:text-slate-800">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-800">Terms</Link>
        </nav>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Promptbuildr</p>
      </div>
    </footer>
  );
}
