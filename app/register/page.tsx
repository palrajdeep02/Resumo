"use client";

import { useActionState, useEffect } from "react";
import { registerUser } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerUser, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment p-4 font-sans text-ink">
      <div className="w-full max-w-md border border-grid bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-lead uppercase mb-2">
            // Register Account
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Create your desk
          </h1>
          <p className="mt-2 text-sm text-lead">
            Tailor your applications and evaluate match compatibility.
          </p>
        </div>

        <form action={action} className="space-y-6">
          {state?.message && (
            <div
              className={`p-3 border text-sm ${
                state.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-crimson/20 bg-crimson/5 text-crimson"
              }`}
            >
              {state.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider font-semibold font-sans">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              className="border-grid focus-visible:ring-crimson rounded-none"
            />
            {state?.errors?.name && (
              <p className="text-xs text-crimson mt-1">{state.errors.name[0]}</p>
            )}
          </div>

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
            <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold font-sans">
              Password
            </Label>
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
            {pending ? "Creating Account..." : "Register User"}
          </Button>

          <div className="text-center text-xs mt-4 text-lead font-sans">
            Already have an account?{" "}
            <Link href="/login" className="text-crimson hover:underline font-semibold">
              Log in here &rarr;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
