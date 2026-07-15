"use client"

import { useState, useTransition, Suspense, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getUserRoleByEmail } from "@/server/auth-actions"

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const registered = searchParams.get("registered")

  const { data: session, status } = useSession()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // If already authenticated, redirect directly to the appropriate dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dest =
        callbackUrl && callbackUrl !== "/" && callbackUrl !== "/login" && callbackUrl !== "/signup"
          ? callbackUrl
          : session.user.role === "RECRUITER"
          ? "/dashboard/recruiter"
          : "/dashboard/candidate"
      window.location.href = dest
    }
  }, [status, session, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (res?.error) {
          setError("Invalid email or password")
        } else {
          // Determine destination from callbackUrl or role lookup
          let dest = callbackUrl
          if (!dest || dest === "/" || dest === "/login" || dest === "/signup") {
            const roleRes = await getUserRoleByEmail(email)
            dest = roleRes.role === "RECRUITER" ? "/dashboard/recruiter" : "/dashboard/candidate"
          }
          window.location.href = dest
        }
      } catch (err) {
        console.error(err)
        setError("Something went wrong. Please try again.")
      }
    })
  }

  // Show a spinner while session status is loading or redirecting
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
          <span className="text-sm text-forest-soft font-medium">Redirecting to dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Conic Ring Brand Visual */}
        <div 
          className="relative w-14 h-14 rounded-full mx-auto flex items-center justify-center shrink-0"
          style={{ background: "conic-gradient(var(--moss) 0% 70%, var(--sand) 70% 100%)" }}
        >
          <div className="absolute inset-[8px] rounded-full bg-sage" />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-serif font-medium text-forest">
            Welcome <em className="text-moss italic font-medium">back.</em>
          </h1>
          <p className="text-sm text-forest-soft mt-2">
            Sign in to see your latest matches.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {registered && (
            <div className="p-3 text-xs text-moss-dark bg-moss/10 border border-moss rounded-[10px] text-center font-medium">
              Registered successfully! Please log in.
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-coral-dark bg-coral/10 border border-coral rounded-[10px] text-center font-medium">
              {error}
            </div>
          )}

          {/* Email field */}
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
          </div>

          {/* Password field */}
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
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span></span>
            <a href="#" className="text-moss-dark font-semibold hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-grow h-px bg-line" />
          <span className="text-xs text-forest-soft font-medium uppercase tracking-wider">or continue with</span>
          <div className="flex-grow h-px bg-line" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full py-2.5 bg-white border border-line text-forest rounded-full text-sm font-semibold hover:bg-sage-2 transition-colors cursor-pointer"
        >
          Continue with Google
        </button>

        <p className="text-xs text-forest-soft text-center font-medium mt-6">
          New to Resumo? <Link href="/signup" className="text-moss-dark font-bold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sage text-forest-soft">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
