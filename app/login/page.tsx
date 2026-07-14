"use client";

import { useActionState } from "react";
import { loginUser } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginUser, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment p-4 font-sans text-ink">
      <div className="w-full max-w-md border border-grid bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-lead uppercase mb-2">
            // Access Portal
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-lead">
            Log in to manage your resume tailors and score checks.
          </p>
        </div>

        <form action={action} className="space-y-6">
          {state?.message && (
            <div className="p-3 border border-crimson/20 bg-crimson/5 text-crimson text-sm">
              {state.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold font-sans">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="alex@example.com"
              className="border-grid focus-visible:ring-crimson rounded-none"
            />
            {state?.errors?.email && (
              <p className="text-xs text-crimson mt-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold font-sans">
                Password
              </Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="border-grid focus-visible:ring-crimson rounded-none"
            />
            {state?.errors?.password && (
              <p className="text-xs text-crimson mt-1">{state.errors.password[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-crimson hover:bg-crimson/90 text-white font-medium rounded-none py-2"
          >
            {pending ? "Logging in..." : "Log In"}
          </Button>

          <div className="text-center text-xs mt-4 text-lead font-sans">
            Need an account?{" "}
            <Link href="/register" className="text-crimson hover:underline font-semibold">
              Register here &rarr;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
