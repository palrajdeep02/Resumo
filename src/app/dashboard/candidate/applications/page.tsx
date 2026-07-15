import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import MatchStamp from "@/components/match-stamp"

export const dynamic = "force-dynamic"

interface ApplicationsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function CandidateApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "CANDIDATE") {
    redirect("/login")
  }

  const { status } = await searchParams

  const candidate = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!candidate) {
    redirect("/dashboard/candidate/profile")
  }

  // Build query filter
  const filter: any = { candidateId: candidate.id }
  if (status && status !== "ALL") {
    filter.status = status
  }

  // Fetch applications
  const applications = await db.application.findMany({
    where: filter,
    include: {
      job: {
        include: {
          company: {
            select: { name: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  })

  const statuses = ["ALL", "APPLIED", "REVIEWED", "SHORTLISTED", "HIRED", "REJECTED"]

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end pb-4 border-b border-line">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              My Applications
            </h1>
            <p className="text-sm text-forest-soft mt-1">Track the status of your submitted applications</p>
          </div>
          <Link
            href="/dashboard/candidate"
            className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const isActive = (!status && s === "ALL") || status === s
            return (
              <Link
                key={s}
                href={s === "ALL" ? `/dashboard/candidate/applications` : `/dashboard/candidate/applications?status=${s}`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? "bg-moss border-moss text-white shadow-none"
                    : "border-line bg-white text-forest-soft hover:bg-sage-2"
                }`}
              >
                {s}
              </Link>
            )
          })}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center p-12 bg-sage-2 rounded-[14px]">
              <p className="text-sm text-forest-soft font-medium mb-4">No applications found matching status.</p>
              <Link
                href="/jobs"
                className="text-xs font-bold text-moss hover:underline"
              >
                Go back to explore matches →
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-line rounded-[14px] p-6 flex flex-col justify-between gap-4 shadow-none hover:border-moss transition-all group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                  <div className="flex items-center gap-4 flex-grow w-full sm:w-auto">
                    {/* Conic Ring Match Score on the LEFT */}
                    {app.matchScore !== null && (
                      <MatchStamp score={app.matchScore} className="w-[60px] h-[60px] text-[13px]" innerBgClass="bg-white" />
                    )}

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        <MatchStamp status={app.status} className="text-[10px] py-0.5" />
                      </div>
                      <h3 className="text-lg font-serif font-medium text-forest leading-tight">{app.job.title}</h3>
                      <p className="text-xs text-forest-soft font-medium">{app.job.company.name}</p>
                      <div className="text-[10px] text-forest-soft font-semibold">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Right side metadata */}
                  <div className="text-center sm:text-right shrink-0 flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
                    <span className="text-xs text-forest-soft font-medium block">
                      📍 {app.job.location || "Remote"}
                    </span>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors inline-block"
                    >
                      View role
                    </Link>
                  </div>
                </div>

                {app.aiFitSummary && (
                  <div className="p-4 bg-sage border border-line border-dashed rounded-[10px] text-xs text-forest-soft leading-relaxed">
                    <span className="font-bold text-moss-dark block mb-1">✨ AI Fit explanation</span>
                    {app.aiFitSummary}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
