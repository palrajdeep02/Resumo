import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    if (session.user.role === "RECRUITER") {
      redirect("/dashboard/recruiter")
    } else {
      redirect("/dashboard/candidate")
    }
  }
  return (
    <div className="flex flex-col flex-grow bg-sage text-forest min-h-screen">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left side info */}
        <div className="md:col-span-7 space-y-6">
          <div className="inline-block font-sans text-xs font-semibold uppercase tracking-wider text-moss-dark">
            AI-native job matching
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-serif font-medium tracking-tight text-forest leading-tight">
            Grow toward work<br />
            that actually <em className="text-moss italic font-medium">fits.</em>
          </h1>
          
          <p className="text-base sm:text-lg text-forest-soft max-w-xl leading-relaxed">
            Resumo reads your resume the way a good mentor would, then shows you exactly how well each role fits — before you spend an application on it.
          </p>

          <div className="flex flex-row gap-4 pt-2">
            <Link
              href="/jobs"
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full text-center transition-colors shadow-sm"
            >
              Build your profile
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full text-center transition-colors"
            >
              Post a job
            </Link>
          </div>
        </div>

        {/* Right side visual progress ring */}
        <div className="md:col-span-5 flex justify-center items-center">
          <div 
            className="relative w-72 h-72 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "conic-gradient(var(--moss) 0% 82%, var(--sand) 82% 100%)"
            }}
          >
            {/* Inner Cutout Circle */}
            <div className="absolute inset-[14px] rounded-full bg-sage flex flex-col items-center justify-center text-center">
              <span className="font-serif text-5xl font-bold text-moss-dark leading-none">
                82%
              </span>
              <span className="text-sm text-forest-soft uppercase tracking-wider mt-1 leading-none font-medium">
                match
              </span>
              <span className="text-base font-semibold text-forest mt-4.5 px-4 block truncate max-w-full">
                Product Designer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-moss-dark">How it works</div>
          <h2 className="text-3xl font-serif font-medium mt-2 text-forest">From seed to <em className="text-moss italic font-medium">bloom.</em></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-sage-2 border border-transparent rounded-[16px] p-8 space-y-4">
            <span className="font-sans text-xs font-bold text-coral-dark uppercase tracking-wider block">
              Seed
            </span>
            <h3 className="font-serif text-xl font-medium text-forest">Plant your profile</h3>
            <p className="text-xs sm:text-sm text-forest-soft leading-relaxed">
              Upload your resume once. Resumo extracts your skills and experience automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-sage-2 border border-transparent rounded-[16px] p-8 space-y-4">
            <span className="font-sans text-xs font-bold text-coral-dark uppercase tracking-wider block">
              Growth
            </span>
            <h3 className="font-serif text-xl font-medium text-forest">Watch your matches</h3>
            <p className="text-xs sm:text-sm text-forest-soft leading-relaxed">
              Every open role shows a ring score — how far your fit has grown toward that job.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-sage-2 border border-transparent rounded-[16px] p-8 space-y-4">
            <span className="font-sans text-xs font-bold text-coral-dark uppercase tracking-wider block">
              Bloom
            </span>
            <h3 className="font-serif text-xl font-medium text-forest">Apply when it's right</h3>
            <p className="text-xs sm:text-sm text-forest-soft leading-relaxed">
              Resumo tells you when an application is strong enough to send, and why.
            </p>
          </div>
        </div>
      </section>

      {/* Open Roles teaser section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-0">
        <div className="mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-moss-dark">Open roles</div>
          <h2 className="text-3xl font-serif font-medium mt-2 text-forest">Jobs matched to <em className="text-moss italic font-medium">you.</em></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job 1 */}
          <div className="bg-sage-2 rounded-[14px] p-5 flex gap-4 items-center">
            <div 
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: "conic-gradient(var(--moss) 0% 91%, var(--sand) 91% 100%)" }}
            >
              <div className="absolute inset-[5px] rounded-full bg-sage-2 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-moss-dark">91%</span>
              </div>
            </div>
            <div>
              <p className="font-serif font-medium text-base text-forest m-0 leading-tight">Backend Engineer</p>
              <p className="text-xs text-forest-soft mt-1 m-0">Fintech Co · Bengaluru</p>
            </div>
          </div>

          {/* Job 2 */}
          <div className="bg-sage-2 rounded-[14px] p-5 flex gap-4 items-center">
            <div 
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: "conic-gradient(var(--coral) 0% 63%, var(--sand) 63% 100%)" }}
            >
              <div className="absolute inset-[5px] rounded-full bg-sage-2 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-coral-dark">63%</span>
              </div>
            </div>
            <div>
              <p className="font-serif font-medium text-base text-forest m-0 leading-tight">Product Designer</p>
              <p className="text-xs text-forest-soft mt-1 m-0">D2C brand · Mumbai</p>
            </div>
          </div>

          {/* Job 3 */}
          <div className="bg-sage-2 rounded-[14px] p-5 flex gap-4 items-center">
            <div 
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: "conic-gradient(var(--moss) 0% 88%, var(--sand) 88% 100%)" }}
            >
              <div className="absolute inset-[5px] rounded-full bg-sage-2 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-moss-dark">88%</span>
              </div>
            </div>
            <div>
              <p className="font-serif font-medium text-base text-forest m-0 leading-tight">Frontend Engineer</p>
              <p className="text-xs text-forest-soft mt-1 m-0">SaaS startup · Pune</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-line flex flex-col sm:flex-row justify-between items-center text-xs text-forest-soft gap-4">
        <span>© 2026 Resumo</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-moss-dark transition-colors">GitHub</a>
          <a href="#" className="hover:text-moss-dark transition-colors">LinkedIn</a>
        </div>
      </footer>
    </div>
  )
}
