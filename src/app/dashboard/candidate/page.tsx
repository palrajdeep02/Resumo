import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getMatchesForCandidate } from "@/server/matching-actions"
import MatchStamp from "@/components/match-stamp"
import { formatSalaryLPA } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function CandidateDashboardPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "CANDIDATE") {
    redirect("/login")
  }

  const userId = session.user.id

  // Fetch profile and applications
  const profile = await db.candidateProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } },
      applications: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  if (!profile) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center">
        <div className="bg-white border border-line rounded-[14px] p-8 max-w-md text-center space-y-4">
          <h2 className="text-xl font-serif font-medium text-forest">Profile Not Found</h2>
          <p className="text-sm text-forest-soft">Your candidate profile could not be loaded. This may be a database configuration issue.</p>
          <p className="text-xs text-forest-soft font-mono bg-sage-2 p-2 rounded">Ensure DATABASE_URL is set in your environment variables.</p>
        </div>
      </div>
    )
  }

  // Calculate completeness %
  let completeness = 0
  if (profile.user?.name) completeness += 20
  if (profile.bio) completeness += 20
  if (profile.experienceYears && profile.experienceYears > 0) completeness += 20
  if (profile.parsedSkills && profile.parsedSkills.length > 0) completeness += 20
  if (profile.resumeUrl) completeness += 20

  // Application counts
  const apps = profile.applications || []
  const appliedCount = apps.filter((a) => a.status === "APPLIED").length
  const shortlistedCount = apps.filter((a) => a.status === "SHORTLISTED").length
  const rejectedCount = apps.filter((a) => a.status === "REJECTED").length

  // Fetch semantic matches
  const { matches: recommendedJobs = [], warning: matchWarning } = await getMatchesForCandidate(profile.id)

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-line pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Hello, {profile.user?.name || "Candidate"}
            </h1>
            <p className="text-sm text-forest-soft mt-1">
              Welcome back to your candidate job match center
            </p>
          </div>
          <Link
            href="/dashboard/candidate/profile"
            className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors self-start sm:self-auto shadow-sm"
          >
            Edit Profile
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Completeness Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 flex flex-col justify-between space-y-4 shadow-none">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-soft">Profile Completeness</h2>
              <p className="text-xs text-forest-soft mt-1">Keep your profile updated to get matched</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-forest-soft">
                <span>Completed</span>
                <span className="text-moss-dark">{completeness}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-line">
                <div
                  className="bg-moss h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {completeness < 100 && (
              <Link
                href="/dashboard/candidate/profile"
                className="text-xs font-semibold text-moss hover:text-moss-dark transition-colors inline-block mt-2"
              >
                Complete profile details →
              </Link>
            )}
          </div>

          {/* Application Status summary */}
          <div className="bg-sage-2 rounded-[16px] p-6 md:col-span-2 space-y-4 shadow-none">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-soft">Application Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white border border-line rounded-[14px]">
                <span className="block text-2xl font-serif font-bold text-forest">{appliedCount}</span>
                <span className="text-[10px] text-forest-soft font-bold uppercase tracking-wider">Applied</span>
              </div>
              <div className="p-4 bg-white border border-line rounded-[14px]">
                <span className="block text-2xl font-serif font-bold text-moss-dark">{shortlistedCount}</span>
                <span className="text-[10px] text-forest-soft font-bold uppercase tracking-wider">Shortlisted</span>
              </div>
              <div className="p-4 bg-white border border-line rounded-[14px]">
                <span className="block text-2xl font-serif font-bold text-coral-dark">{rejectedCount}</span>
                <span className="text-[10px] text-forest-soft font-bold uppercase tracking-wider">Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Recommended Jobs */}
        <div className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="text-xl font-serif font-medium text-forest">Recommended Job Matches</h2>
          </div>
          
          {matchWarning && (
            <div className="p-4 bg-coral/10 border border-coral text-coral-dark text-xs font-medium rounded-[10px]">
              ⚠️ {matchWarning}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {recommendedJobs.length === 0 ? (
              <div className="text-center p-8 bg-sage-2 rounded-[16px]">
                <p className="text-xs text-forest-soft">No active job matches found. Check back later!</p>
              </div>
            ) : (
              recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-line rounded-[14px] p-6 flex flex-col justify-between gap-4 transition-all shadow-none group"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold bg-sage text-moss-dark border border-line">
                          {job.employmentType.replace("_", " ")}
                        </span>
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold bg-sage-2 text-forest-soft border border-transparent">
                          ID: {job.id.substring(0, 8)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-serif font-medium text-forest group-hover:text-moss transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-forest-soft font-medium uppercase tracking-wider">{job.companyName}</p>
                      
                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skillsRequired.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 text-[11px] bg-sage-2 text-forest-soft rounded-full border border-transparent"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-start shrink-0">
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-sm font-serif font-bold text-forest">
                          {formatSalaryLPA(job.salaryMin, job.salaryMax)}
                        </span>
                        <span className="text-[10px] text-forest-soft font-medium mb-2">📍 {job.location || "Remote"}</span>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-5 py-2 text-xs font-medium text-forest border border-forest hover:bg-sage rounded-full transition-colors"
                        >
                          View role
                        </Link>
                      </div>
                      <MatchStamp score={job.matchScore} className="w-15 h-15" />
                    </div>
                  </div>

                  {job.fitExplanation && (
                    <div className="p-4 bg-sage border border-line border-dashed rounded-[10px] text-xs text-forest-soft leading-relaxed font-sans">
                      <span className="font-bold text-moss-dark block mb-1">✨ AI Fit Explanation</span>
                      {job.fitExplanation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
