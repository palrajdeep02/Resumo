import { db } from "@/lib/db"
import { assertCompanyOwnership } from "@/server/recruiter-actions"
import { getRankedApplicantsForJob } from "@/server/matching-actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import ApplicantsList from "./applicants-list"
import { formatSalaryLPA } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface RecruiterJobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RecruiterJobDetailPage({ params }: RecruiterJobDetailPageProps) {
  const companyId = await assertCompanyOwnership()
  const { id } = await params

  const job = await db.job.findUnique({
    where: { id },
  })

  if (!job || job.companyId !== companyId) {
    notFound()
  }

  // Get ranked applicants
  const { applicants = [], error } = await getRankedApplicantsForJob(job.id)

  const serializedApplicants = applicants.map((app) => ({
    id: app.id,
    status: app.status as any,
    matchScore: app.matchScore,
    aiFitSummary: app.aiFitSummary,
    appliedAt: app.appliedAt,
    candidate: {
      experienceYears: app.candidate.experienceYears,
      parsedSkills: app.candidate.parsedSkills,
      bio: app.candidate.bio,
      resumeUrl: app.candidate.resumeUrl,
      user: {
        name: app.candidate.user.name,
        email: app.candidate.user.email,
      },
    },
  }))

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-line pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-moss text-white border border-moss">
                {job.status}
              </span>
              <span className="text-xs text-forest-soft font-semibold">📍 {job.location || "Remote"}</span>
            </div>
            <h1 className="text-3xl font-serif font-medium text-forest leading-tight">
              {job.title}
            </h1>
            <p className="text-sm text-forest-soft">Manage candidates and view match details</p>
          </div>
          <div className="flex space-x-3 self-start sm:self-auto shrink-0">
            <Link
              href="/dashboard/recruiter/jobs"
              className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
            >
              Back to Jobs
            </Link>
            <Link
              href={`/dashboard/recruiter/jobs/${job.id}/edit`}
              className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors shadow-sm"
            >
              Edit Details
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 text-xs text-coral-dark bg-coral/10 border border-coral rounded-[10px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job details summary card */}
          <div className="bg-sage-2 rounded-[16px] p-6 h-fit space-y-4">
            <h2 className="text-base font-serif font-medium text-forest">Job Profile Summary</h2>
            <div className="space-y-3 text-xs leading-normal">
              <div>
                <span className="text-forest-soft block font-bold uppercase tracking-wider text-[10px]">Employment Type</span>
                <span className="text-forest font-bold">{job.employmentType.replace("_", " ")}</span>
              </div>
              {job.salaryMin && job.salaryMax && (
                <div>
                  <span className="text-forest-soft block font-bold uppercase tracking-wider text-[10px]">Salary Range</span>
                  <span className="text-forest font-bold">
                    {formatSalaryLPA(job.salaryMin, job.salaryMax)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-forest-soft block font-bold uppercase tracking-wider text-[10px]">Key Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {job.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-white text-forest-soft border border-line rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Applicants list column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h2 className="text-xl font-serif font-medium text-forest">
                Applicants ({serializedApplicants.length})
              </h2>
            </div>
            <ApplicantsList initialApplicants={serializedApplicants} jobId={job.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
