"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { getCompanyJobs, deleteOrCloseJob } from "@/server/recruiter-actions"

interface JobEntry {
  id: string
  title: string
  location: string | null
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP"
  status: "DRAFT" | "PUBLISHED" | "CLOSED"
  createdAt: Date
  _count: {
    applications: number
  }
}

export default function RecruiterJobsPage() {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadJobs() {
    setLoading(true)
    const res = await getCompanyJobs()
    if (res.error) {
      setError(res.error)
    } else if (res.jobs) {
      setJobs(res.jobs as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleDeleteOrClose = async (jobId: string) => {
    if (!confirm("Are you sure you want to close or delete this job listing?")) return

    startTransition(async () => {
      const res = await deleteOrCloseJob(jobId)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(res.message || "Job list updated")
        loadJobs()
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage text-forest-soft">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
          <span>Loading Job Listings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end pb-4 border-b border-line gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Manage Job Listings
            </h1>
            <p className="text-sm text-forest-soft mt-1">Review and maintain your active listings</p>
          </div>
          <div className="flex space-x-3 shrink-0">
            <Link
              href="/dashboard/recruiter"
              className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/recruiter/jobs/new"
              className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors shadow-sm"
            >
              + Post a Job
            </Link>
          </div>
        </div>

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

        {/* Jobs listings */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center p-12 bg-sage-2 rounded-[16px]">
              <p className="text-sm text-forest-soft font-semibold mb-4">No job listings found.</p>
              <Link
                href="/dashboard/recruiter/jobs/new"
                className="text-xs font-bold text-moss hover:underline"
              >
                Post your first job listing now →
              </Link>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-line rounded-[14px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-moss transition-all shadow-none"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-serif font-medium text-forest">{job.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                        job.status === "PUBLISHED"
                          ? "bg-moss text-white border-moss"
                          : job.status === "DRAFT"
                          ? "bg-sand text-forest border-line"
                          : "bg-coral text-white border-coral"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex space-x-4 text-xs text-forest-soft font-medium">
                    <span>📍 {job.location || "Remote"}</span>
                    <span>💼 {job.employmentType.replace("_", " ")}</span>
                    <span>🗓️ {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-forest-soft font-medium">
                    Applicants count:{" "}
                    <span className="text-moss font-bold">{job._count.applications}</span>
                  </div>
                </div>

                <div className="flex space-x-3 self-stretch sm:self-center">
                  <Link
                    href={`/dashboard/recruiter/jobs/${job.id}/edit`}
                    className="flex-grow sm:flex-none text-center px-4 py-1.5 text-xs font-semibold border border-forest hover:bg-sage-2 rounded-full text-forest transition-colors"
                  >
                    Edit
                  </Link>
                  {job.status !== "CLOSED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteOrClose(job.id)}
                      className="flex-grow sm:flex-none px-4 py-1.5 text-xs font-semibold border border-coral hover:bg-coral/10 text-coral-dark rounded-full transition-colors cursor-pointer"
                    >
                      Close / Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
