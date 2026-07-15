import { getRecruiterStats } from "@/server/recruiter-actions"
import Link from "next/link"
import AnalyticsChart from "./analytics-chart"

export const dynamic = "force-dynamic"

export default async function RecruiterDashboardPage() {
  const res = await getRecruiterStats()

  if (res.error) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center text-forest-soft">
        <div className="p-4 bg-coral/10 border border-coral rounded-[10px]">
          <p className="text-sm font-semibold">Error: {res.error}</p>
        </div>
      </div>
    )
  }

  const activeJobs = res.stats?.activeJobsCount || 0
  const totalApplicants = res.stats?.totalApplicants || 0
  const chartData = res.stats?.chartData || []

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-line pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Recruiter Dashboard
            </h1>
            <p className="text-sm text-forest-soft mt-1">
              Manage your company listings, applicants, and company settings
            </p>
          </div>
          <div className="flex space-x-3 self-start sm:self-auto">
            <Link
              href="/dashboard/recruiter/company"
              className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
            >
              Company Profile
            </Link>
            <Link
              href="/dashboard/recruiter/jobs/new"
              className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors shadow-sm"
            >
              + Post a Job
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4 shadow-none border-none">
            <div>
              <h2 className="text-xs font-bold text-forest-soft uppercase tracking-wider">Active Job Posts</h2>
              <span className="block text-4xl font-serif font-bold text-moss-dark mt-2">{activeJobs}</span>
            </div>
            <Link
              href="/dashboard/recruiter/jobs"
              className="text-xs font-semibold text-moss hover:text-moss-dark transition-colors inline-block"
            >
              Manage job listings →
            </Link>
          </div>

          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4 shadow-none border-none">
            <div>
              <h2 className="text-xs font-bold text-forest-soft uppercase tracking-wider">Total Applicants</h2>
              <span className="block text-4xl font-serif font-bold text-coral-dark mt-2">{totalApplicants}</span>
            </div>
            <p className="text-xs text-forest-soft">Accumulated across all posted positions</p>
          </div>
        </div>

        {/* Analytics Chart Container */}
        <div className="bg-sage-2 rounded-[16px] p-6 space-y-4 shadow-none border-none">
          <div>
            <h2 className="text-base font-serif font-medium text-forest">Applicant Distribution</h2>
            <p className="text-xs text-forest-soft mt-1">Breakdown of applicant counts per job posting</p>
          </div>
          <AnalyticsChart data={chartData} />
        </div>
      </div>
    </div>
  )
}
