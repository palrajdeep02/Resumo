"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProfileFormProps {
  initialData: {
    baseResumeText?: string | null;
    skills?: string[] | null;
    experienceYears?: number | null;
    targetRoles?: string[] | null;
  } | null;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfile, null);

  const defaultSkills = initialData?.skills?.join(", ") || "";
  const defaultTargetRoles = initialData?.targetRoles?.join(", ") || "";

  return (
    <form action={action} className="space-y-8 bg-white border border-grid p-8 shadow-sm">
      {state?.message && (
        <div
          className={`p-4 border text-sm ${
            state.success
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-crimson/20 bg-crimson/5 text-crimson"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Experience Years & Target Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="experienceYears" className="font-mono text-xs uppercase tracking-wider text-lead">
            // Years of Experience
          </Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min="0"
            required
            defaultValue={initialData?.experienceYears ?? 0}
            className="border-grid focus-visible:ring-crimson rounded-none"
          />
          {state?.errors?.experienceYears && (
            <p className="text-xs text-crimson mt-1">{state.errors.experienceYears[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetRoles" className="font-mono text-xs uppercase tracking-wider text-lead">
            // Target Roles (comma separated)
          </Label>
          <Input
            id="targetRoles"
            name="targetRoles"
            type="text"
            required
            defaultValue={defaultTargetRoles}
            placeholder="e.g. Frontend Engineer, Fullstack Developer"
            className="border-grid focus-visible:ring-crimson rounded-none"
          />
          {state?.errors?.targetRoles && (
            <p className="text-xs text-crimson mt-1">{state.errors.targetRoles[0]}</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label htmlFor="skills" className="font-mono text-xs uppercase tracking-wider text-lead">
          // Core Skills & Keywords (comma separated)
        </Label>
        <Input
          id="skills"
          name="skills"
          type="text"
          required
          defaultValue={defaultSkills}
          placeholder="e.g. React, TypeScript, Next.js, PostgreSQL"
          className="border-grid focus-visible:ring-crimson rounded-none"
        />
        {state?.errors?.skills && (
          <p className="text-xs text-crimson mt-1">{state.errors.skills[0]}</p>
        )}
      </div>

      {/* Base Resume Text */}
      <div className="space-y-2">
        <Label htmlFor="baseResumeText" className="font-mono text-xs uppercase tracking-wider text-lead">
          // Base Resume Plain Text (used for tailoring & matching)
        </Label>
        <Textarea
          id="baseResumeText"
          name="baseResumeText"
          rows={12}
          required
          defaultValue={initialData?.baseResumeText || ""}
          placeholder="Paste the full plain text content of your primary/base resume here..."
          className="border-grid focus-visible:ring-crimson rounded-none font-sans text-sm resize-y min-h-[250px]"
        />
        {state?.errors?.baseResumeText && (
          <p className="text-xs text-crimson mt-1">{state.errors.baseResumeText[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-grid">
        <Button
          type="submit"
          disabled={pending}
          className="bg-crimson hover:bg-crimson/90 text-white font-medium px-8 py-2 rounded-none"
        >
          {pending ? "Saving..." : "Save Profile Details"}
        </Button>
      </div>
    </form>
  );
}
