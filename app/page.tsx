import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center bg-parchment font-sans text-ink">
      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32 space-y-12">
        {/* Editorial Subtitle */}
        <div className="space-y-4 text-center md:text-left border-b border-grid pb-10">
          <span className="font-mono text-xs uppercase tracking-widest text-crimson font-semibold">
            // Technical Recruiter Copilot
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight leading-none text-ink">
            Resumo
          </h1>
          <p className="text-lg md:text-xl text-lead max-w-2xl font-serif italic mt-2">
            An AI-powered job application tailoring and match-scoring assistant designed to optimize your resume bullets and cover letters for target listings.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="border border-grid bg-white p-6 space-y-3">
            <span className="font-mono text-xs text-lead block">// 01 / MATCH METRICS</span>
            <h3 className="font-serif text-lg font-semibold">Recruiter Match Evaluation</h3>
            <p className="text-xs text-lead leading-relaxed">
              Scan target job descriptions against your base resume keywords. Generate strict match scoring levels, key strengths, and identified skill gaps.
            </p>
          </div>

          <div className="border border-grid bg-white p-6 space-y-3">
            <span className="font-mono text-xs text-lead block">// 02 / WORKSPACE TAILORING</span>
            <h3 className="font-serif text-lg font-semibold">AI Streaming Bullets</h3>
            <p className="text-xs text-lead leading-relaxed">
              Stream tailored experience rewrite drafts and cover letters. Modify outputs in the live editor workspace and save changes securely.
            </p>
          </div>

          <div className="border border-grid bg-white p-6 space-y-3">
            <span className="font-mono text-xs text-lead block">// 03 / VERSION CONTROL</span>
            <h3 className="font-serif text-lg font-semibold">Automatic Versioning</h3>
            <p className="text-xs text-lead leading-relaxed">
              Increment draft versions automatically on each AI generation. Review and select older snapshots dynamically using the editor dropdown.
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-crimson hover:bg-crimson/90 text-white font-medium px-8 py-3 rounded-none text-xs font-mono uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
          >
            Enter Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center border border-grid bg-white hover:bg-parchment/10 text-ink font-medium px-8 py-3 rounded-none text-xs font-mono uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center border border-grid bg-white hover:bg-parchment/10 text-ink font-medium px-8 py-3 rounded-none text-xs font-mono uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
          >
            Register Account
          </Link>
        </div>
      </main>
    </div>
  );
}
