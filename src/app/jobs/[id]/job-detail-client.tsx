"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { checkApplicationQualityAction, applyToJobAction } from "@/server/application-actions"
import { toast } from "sonner"
import { formatSalaryLPA } from "@/lib/utils"

interface JobDetailClientProps {
  job: {
    id: string
    title: string
    description: string
    location: string | null
    employmentType: string
    salaryMin: number | null
    salaryMax: number | null
    skillsRequired: string[]
    company: { name: string; logoUrl: string | null }
  }
  userRole?: string
  alreadyApplied: boolean
}

export default function JobDetailClient({ job, userRole, alreadyApplied }: JobDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [hasApplied, setHasApplied] = useState(alreadyApplied)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Quality check modal state
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [missingSkills, setMissingSkills] = useState<string[]>([])

  const handleApplyClick = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      // 1. Run AI application quality check
      const checkRes = await checkApplicationQualityAction(job.id)
      if (checkRes.warning) {
        setMissingSkills(checkRes.missingSkills || [])
        setShowWarningModal(true)
      } else {
        // Proceed directly
        await submitApplication()
      }
    })
  }

  const submitApplication = async () => {
    setShowWarningModal(false)
    startTransition(async () => {
      const res = await applyToJobAction(job.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Application submitted successfully!")
        setHasApplied(true)
        setTimeout(() => {
          router.push("/dashboard/candidate/applications")
        }, 1500)
      }
    })
  }

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 text-xs text-coral-dark bg-coral/10 border border-coral rounded-[10px] font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-xs text-moss-dark bg-moss/10 border border-moss rounded-[10px] font-medium">
            {success}
          </div>
        )}

        {/* Back Link */}
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-forest hover:underline transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white border border-line rounded-[14px] p-8 space-y-6 shadow-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-line gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="px-3 py-0.5 rounded-full text-[10px] bg-sage border border-line text-moss-dark font-semibold">
                  {job.employmentType.replace("_", " ")}
                </span>
                <span className="text-xs text-forest-soft font-semibold">📍 {job.location || "Remote"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest tracking-tight leading-tight">{job.title}</h1>
              <p className="text-sm text-forest-soft font-semibold">{job.company.name}</p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              {job.salaryMin && job.salaryMax && (
                <div className="text-base font-serif font-bold text-forest mb-2 block">
                  {formatSalaryLPA(job.salaryMin, job.salaryMax)}
                </div>
              )}

              {/* Action Buttons based on User Role */}
              {!userRole ? (
                <Link
                  href="/login"
                  className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors inline-block text-center shadow-sm"
                >
                  Log in to Apply
                </Link>
              ) : userRole === "CANDIDATE" ? (
                hasApplied ? (
                  <button
                    disabled
                    className="px-5 py-2 text-xs font-semibold text-forest-soft bg-sage-2 border border-line rounded-full cursor-not-allowed"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={handleApplyClick}
                    disabled={isPending}
                    className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors cursor-pointer"
                  >
                    {isPending ? "Submitting..." : "Apply Now"}
                  </button>
                )
              ) : (
                <span className="text-xs text-forest-soft font-bold italic block">Recruiter Mode</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-base font-serif font-medium text-forest">Job Description</h2>
            <p className="text-sm text-forest-soft leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Required Skills */}
          <div className="space-y-3">
            <h2 className="text-base font-serif font-medium text-forest">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-sage-2 text-forest-soft rounded-full text-xs font-semibold border border-transparent"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Quality Check Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/65 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-line rounded-[16px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-coral-dark">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-serif font-medium">Profile Match Warning</h3>
            </div>

            <div className="text-sm text-forest-soft space-y-2 leading-relaxed">
              <p>Your profile does not fully match this role. Consider adding the following missing skills to your profile before applying:</p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {missingSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 text-xs font-semibold bg-coral/10 text-coral-dark border border-transparent rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
              >
                Cancel & Update Profile
              </button>
              <button
                type="button"
                onClick={submitApplication}
                className="flex-1 py-2 text-xs font-semibold text-white bg-coral hover:bg-coral-dark rounded-full transition-colors cursor-pointer"
              >
                Apply Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
