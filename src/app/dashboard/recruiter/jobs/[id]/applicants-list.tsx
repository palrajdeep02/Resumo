"use client"

import { useState, useTransition } from "react"
import { updateApplicationStatusAction } from "@/server/application-actions"
import { recomputeApplicationScoreAction } from "@/server/matching-actions"
import { toast } from "sonner"
import MatchStamp from "@/components/match-stamp"

interface Applicant {
  id: string
  status: "APPLIED" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  matchScore: number | null
  aiFitSummary: string | null
  appliedAt: Date
  candidate: {
    experienceYears: number | null
    parsedSkills: string[]
    bio: string | null
    resumeUrl: string | null
    user: {
      name: string | null
      email: string | null
    }
  }
}

export default function ApplicantsList({
  initialApplicants,
  jobId,
}: {
  initialApplicants: Applicant[]
  jobId: string
}) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (
    appId: string,
    newStatus: "APPLIED" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  ) => {
    setError(null)
    setSuccess(null)
    setUpdatingId(appId)

    startTransition(async () => {
      const res = await updateApplicationStatusAction(appId, newStatus)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Application status updated!")
        // Update local state
        setApplicants((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        )
      }
      setUpdatingId(null)
    })
  }

  const handleRecompute = async (appId: string) => {
    setError(null)
    setSuccess(null)
    setUpdatingId(appId)

    startTransition(async () => {
      const res = await recomputeApplicationScoreAction(appId)
      if (res.error) {
        toast.error(res.error)
      } else if (res.application) {
        toast.success("Score recomputed!")
        // Update local state with recomputed values
        setApplicants((prev) =>
          prev
            .map((app) =>
              app.id === appId
                ? {
                    ...app,
                    matchScore: res.application.matchScore,
                    aiFitSummary: res.application.aiFitSummary,
                  }
                : app
            )
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        )
      }
      setUpdatingId(null)
    })
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 text-xs font-semibold text-moss-dark bg-moss/10 border border-moss rounded-[10px]">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 text-xs font-semibold text-coral-dark bg-coral/10 border border-coral rounded-[10px]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {applicants.length === 0 ? (
          <div className="text-center p-12 bg-sage-2 rounded-[16px]">
            <p className="text-sm text-forest-soft font-semibold">No applications submitted yet for this position.</p>
          </div>
        ) : (
          applicants.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-line rounded-[14px] p-6 space-y-4 hover:border-moss transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
                <div className="flex items-center gap-4">
                  {/* Conic Ring Match Score on the LEFT */}
                  {app.matchScore !== null && (
                    <MatchStamp score={app.matchScore} className="w-[50px] h-[50px] text-[11px]" innerBgClass="bg-white" />
                  )}

                  <div>
                    <h3 className="text-lg font-serif font-medium text-forest">
                      {app.candidate.user.name || "Anonymous Candidate"}
                    </h3>
                    <p className="text-xs text-forest-soft font-medium mt-0.5">
                      ✉️ {app.candidate.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center text-[10px] text-forest-soft font-bold">
                      <span>💼 Experience: {app.candidate.experienceYears || 0} years</span>
                      {app.candidate.resumeUrl && (
                        <a
                          href={app.candidate.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-moss hover:underline"
                        >
                          📄 View Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto self-end sm:self-center shrink-0">
                  {/* Status Dropdown */}
                  <select
                    disabled={updatingId === app.id}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss disabled:opacity-50"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {/* Recompute button */}
                  <button
                    onClick={() => handleRecompute(app.id)}
                    disabled={updatingId === app.id}
                    className="px-4 py-1.5 border border-forest hover:bg-sage-2 rounded-full text-xs font-semibold text-forest transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {updatingId === app.id ? "..." : "Recompute"}
                  </button>
                </div>
              </div>

              {/* Bio summary */}
              {app.candidate.bio && (
                <div className="text-xs text-forest-soft leading-normal">
                  <span className="font-bold text-moss-dark block mb-1">Candidate Bio</span>
                  {app.candidate.bio}
                </div>
              )}

              {/* Skills list */}
              {app.candidate.parsedSkills && app.candidate.parsedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {app.candidate.parsedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-sage-2 text-forest-soft border border-transparent rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Cached Fit explanation */}
              {app.aiFitSummary && (
                <div className="p-4 bg-sage border border-line border-dashed rounded-[10px] text-xs text-forest-soft leading-relaxed">
                  <span className="font-bold text-moss-dark block mb-1">✨ AI Fit Explanation</span>
                  {app.aiFitSummary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
