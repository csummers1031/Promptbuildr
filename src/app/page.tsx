import BuilderForm from "@/components/BuilderForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Prompt<span className="text-indigo-600">buildr</span>
        </span>
        <a
          href="#builder"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Build a prompt
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <section className="pb-8 pt-6 text-center sm:pt-10">
          <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Turn what you want to do into a{" "}
            <span className="text-indigo-600">great AI prompt</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-slate-600">
            Describe your task — business or personal. Get a ready-to-paste prompt plus
            step-by-step setup, tuned for the AI tool you actually use.
          </p>
        </section>

        <section id="builder" className="scroll-mt-6">
          <BuilderForm />
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature title="For anything" body="Cold emails, trip plans, agents, speeches, spreadsheets — any task, any purpose." />
          <Feature title="Tool-tuned" body="XML for Claude, clean sections for ChatGPT, dense descriptors for image AI." />
          <Feature title="Ready to run" body="Copy the prompt, follow the steps, and go. No prompt-engineering degree required." />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
