"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerAction } from "@/server/auth-actions"

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form states
  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">("CANDIDATE")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Recruiter specific states
  const [companyAction, setCompanyAction] = useState<"create" | "join">("create")
  const [companyName, setCompanyName] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [companyInviteCode, setCompanyInviteCode] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    if (!name || !email || !password) {
      setError("Please fill in name, email, and password")
      return
    }

    startTransition(async () => {
      const res = await registerAction({
        name,
        email,
        password,
        role,
        companyAction: role === "RECRUITER" ? companyAction : undefined,
        companyName: role === "RECRUITER" && companyAction === "create" ? companyName : undefined,
        companyWebsite: role === "RECRUITER" && companyAction === "create" ? companyWebsite : undefined,
        companyDescription: role === "RECRUITER" && companyAction === "create" ? companyDescription : undefined,
        companyInviteCode: role === "RECRUITER" && companyAction === "join" ? companyInviteCode : undefined,
      })

      if (res?.error) {
        if (typeof res.error === "string") {
          setError(res.error)
        } else {
          setValidationErrors(res.error)
        }
      } else {
        router.push("/login?registered=true")
      }
    })
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-medium text-forest">
            Start <em className="text-moss italic font-medium">growing.</em>
          </h1>
          <p className="text-sm text-forest-soft mt-2">
            Create your account to get matched or start hiring.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex bg-sage-2 rounded-full p-1 border border-line">
          <button
            type="button"
            onClick={() => setRole("CANDIDATE")}
            className={`flex-1 text-center py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              role === "CANDIDATE"
                ? "bg-white text-moss-dark shadow-sm"
                : "text-forest-soft hover:text-forest"
            }`}
          >
            I'm a candidate
          </button>
          <button
            type="button"
            onClick={() => setRole("RECRUITER")}
            className={`flex-1 text-center py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              role === "RECRUITER"
                ? "bg-white text-moss-dark shadow-sm"
                : "text-forest-soft hover:text-forest"
            }`}
          >
            I'm hiring
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-coral-dark bg-coral/10 border border-coral rounded-[10px] text-center font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              disabled={isPending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
              placeholder="Priya Sharma"
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-coral-dark font-medium">{validationErrors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
              placeholder="name@company.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-coral-dark font-medium">{validationErrors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
              placeholder="At least 8 characters"
            />
            {validationErrors.password && (
              <p className="mt-1 text-xs text-coral-dark font-medium">{validationErrors.password[0]}</p>
            )}
          </div>

          {/* Recruiter extra organization options */}
          {role === "RECRUITER" && (
            <div className="bg-sage-2 rounded-[14px] p-4 border border-line space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-soft">
                  Company Affiliation
                </span>
                <div className="flex space-x-2 bg-sage rounded-full p-0.5 border border-line">
                  <button
                    type="button"
                    onClick={() => setCompanyAction("create")}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      companyAction === "create"
                        ? "bg-white text-moss-dark shadow-sm"
                        : "text-forest-soft hover:text-forest"
                    }`}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyAction("join")}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      companyAction === "join"
                        ? "bg-white text-moss-dark shadow-sm"
                        : "text-forest-soft hover:text-forest"
                    }`}
                  >
                    Join
                  </button>
                </div>
              </div>

              {companyAction === "create" ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="companyName" className="block text-[10px] font-bold text-coral-dark uppercase tracking-wider mb-1">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required={role === "RECRUITER" && companyAction === "create"}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label htmlFor="companyWebsite" className="block text-[10px] font-bold text-forest-soft uppercase tracking-wider mb-1">
                      Website (Optional)
                    </label>
                    <input
                      id="companyWebsite"
                      type="text"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                      placeholder="https://acme.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="companyDescription" className="block text-[10px] font-bold text-forest-soft uppercase tracking-wider mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="companyDescription"
                      rows={2}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs resize-none"
                      placeholder="We build software solutions..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="companyInviteCode" className="block text-[10px] font-bold text-coral-dark uppercase tracking-wider mb-1">
                      Company ID / Invite Code
                    </label>
                    <input
                      id="companyInviteCode"
                      type="text"
                      required={role === "RECRUITER" && companyAction === "join"}
                      value={companyInviteCode}
                      onChange={(e) => setCompanyInviteCode(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                      placeholder="Enter Company UUID..."
                    />
                    <p className="mt-1.5 text-[9px] text-forest-soft leading-relaxed">
                      To join an existing company, enter its unique invite code.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-forest-soft leading-relaxed text-center">
            Once you're in, upload your resume and Resumo builds your profile automatically — no forms to fill by hand.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-[11px] text-forest-soft text-center leading-relaxed">
          By continuing, you agree to Resumo's <a href="#" className="text-moss-dark font-medium underline">Terms</a> and <a href="#" className="text-moss-dark font-medium underline">Privacy Policy</a>.
        </p>

        <p className="text-xs text-forest-soft text-center font-medium mt-4">
          Already have an account? <Link href="/login" className="text-moss-dark font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
