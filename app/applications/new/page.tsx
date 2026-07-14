"use client";

import { useActionState } from "react";
import { createApplication } from "@/app/actions/applications";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function NewApplicationPage() {
  const [state, action, pending] = useActionState(createApplication, null);

  return (
    <div className="min-h-screen bg-parchment font-sans text-ink">
      {/* Header */}
      <header className="border-b border-grid bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold tracking-tight hover:opacity-80">
            Resumo
          </Link>
          <nav className="flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-crimson text-crimson">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:text-crimson">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-end border-b border-grid pb-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-lead uppercase mb-1">
              // Initiate Job Tracking
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              New Application
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-lead hover:text-ink">
            &larr; Cancel & Go Back
          </Link>
        </div>

        <form action={action} className="space-y-6 bg-white border border-grid p-8 shadow-sm">
          {state?.message && (
            <div className="p-4 border border-crimson/20 bg-crimson/5 text-crimson text-sm">
              {state.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="font-mono text-xs uppercase tracking-wider text-lead">
                // Company Name
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                required
                placeholder="e.g. Acme Corp"
                className="border-grid focus-visible:ring-crimson rounded-none"
              />
              {state?.errors?.company && (
                <p className="text-xs text-crimson mt-1">{state.errors.company[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="font-mono text-xs uppercase tracking-wider text-lead">
                // Job Title
              </Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                className="border-grid focus-visible:ring-crimson rounded-none"
              />
              {state?.errors?.jobTitle && (
                <p className="text-xs text-crimson mt-1">{state.errors.jobTitle[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescriptionText" className="font-mono text-xs uppercase tracking-wider text-lead">
              // Job Description Plain Text
            </Label>
            <Textarea
              id="jobDescriptionText"
              name="jobDescriptionText"
              rows={12}
              required
              placeholder="Paste the full job description, requirements, and responsibilities here..."
              className="border-grid focus-visible:ring-crimson rounded-none font-sans text-sm resize-y min-h-[250px]"
            />
            {state?.errors?.jobDescriptionText && (
              <p className="text-xs text-crimson mt-1">{state.errors.jobDescriptionText[0]}</p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-grid gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-grid text-sm font-medium hover:bg-muted text-lead flex items-center justify-center"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={pending}
              className="bg-crimson hover:bg-crimson/90 text-white font-medium px-8 py-2 rounded-none"
            >
              {pending ? "Adding Tracker..." : "Track Application"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
