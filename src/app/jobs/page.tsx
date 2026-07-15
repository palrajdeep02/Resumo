import { searchJobsAction } from "@/server/search-actions"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import MatchStamp from "@/components/match-stamp"
import { formatSalaryLPA } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    location?: string
    employmentType?: string
    salaryMin?: string
    sort?: string
    page?: string
    workMode?: string
    minMatch?: string
  }>
}

export default async function PublicJobsPage({ searchParams }: SearchPageProps) {
  const session = await auth()
  const { q, location, employmentType, salaryMin, sort, page, workMode, minMatch } = await searchParams

  const pageNum = parseInt(page || "1") || 1
  const salaryMinVal = parseInt(salaryMin || "0") || 0
  const minMatchVal = parseInt(minMatch || "0") || 0

  // 1. Fetch search results
  const res = await searchJobsAction({
    q,
    location,
    employmentType,
    salaryMin: salaryMinVal > 0 ? salaryMinVal : undefined,
    sort: sort as any,
    page: pageNum,
    pageSize: 10,
    workMode,
    minMatch: minMatchVal > 0 ? minMatchVal : undefined,
  })

  if (res.error) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center text-forest-soft">
        <div className="p-4 bg-coral/5 border border-coral rounded-[10px] font-sans text-xs">
          Error: {res.error}
        </div>
      </div>
    )
  }

  const { jobs = [], pagination = { page: 1, totalPages: 1, totalItems: 0 }, hasCandidateEmbedding = false } = res

  // 2. Fetch candidate skills if logged in to highlight matching skills
  let candidateSkills: string[] = []
  if (session?.user?.id && session.user.role === "CANDIDATE") {
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      select: { parsedSkills: true },
    })
    if (candidate) {
      candidateSkills = candidate.parsedSkills || []
    }
  }

  // Build helper to generate URL with new query parameters
  const getFilterUrl = (newParams: Record<string, string | number | undefined>) => {
    const urlParams = new URLSearchParams()
    if (q) urlParams.set("q", q)
    if (location) urlParams.set("location", location)
    if (employmentType) urlParams.set("employmentType", employmentType)
    if (salaryMin) urlParams.set("salaryMin", salaryMin)
    if (sort) urlParams.set("sort", sort)
    if (workMode) urlParams.set("workMode", workMode)
    if (minMatch) urlParams.set("minMatch", minMatch)
    urlParams.set("page", String(pageNum))

    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === "") {
        urlParams.delete(k)
      } else {
        urlParams.set(k, String(v))
      }
    })
    return `/jobs?${urlParams.toString()}`
  }

  // Helper to format salary values
  const formatSalary = (min: number | null, max: number | null) => {
    return formatSalaryLPA(min, max)
  }

  // Helper to toggle checklist item URLs
  const getToggleChecklistUrl = (key: string, currentValue: string, targetValue: string) => {
    return getFilterUrl({ [key]: currentValue === targetValue ? "ALL" : targetValue, page: 1 })
  }

  return (
    <div className="min-h-screen bg-sage flex flex-col">
      {/* Top Searchbar */}
      <div className="bg-sage-2 border-b border-line py-5 px-4 sm:px-6 lg:px-8">
        <form method="GET" action="/jobs" className="max-w-[1180px] mx-auto flex flex-col sm:flex-row gap-3">
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q || ""}
            placeholder="Job title, skill, or company"
            className="flex-grow px-5 py-3 rounded-full border border-line bg-white text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm placeholder-[#A9AC98]"
          />
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={location || ""}
            placeholder="Location"
            className="sm:max-w-[220px] px-5 py-3 rounded-full border border-line bg-white text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm placeholder-[#A9AC98]"
          />
          
          {/* Preserving hidden parameter fields to prevent loss of sort/type when filtering via top searchbar */}
          <input type="hidden" name="employmentType" value={employmentType || "ALL"} />
          <input type="hidden" name="salaryMin" value={salaryMin || ""} />
          <input type="hidden" name="sort" value={sort || "newest"} />
          <input type="hidden" name="workMode" value={workMode || "ALL"} />
          <input type="hidden" name="minMatch" value={minMatch || ""} />
          
          <button
            type="submit"
            className="px-6 py-3 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        
        {/* Left Sidebar Filters */}
        <div className="md:col-span-3 space-y-6">
          {/* Sort By Filter */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-forest-soft uppercase tracking-wider">Sort by</h4>
            <div className="flex flex-wrap gap-2">
              {session?.user?.role === "CANDIDATE" && (
                <Link
                  href={hasCandidateEmbedding ? getFilterUrl({ sort: "best", page: 1 }) : "#"}
                  className={`px-4 py-1.5 text-xs rounded-full border transition-all ${
                    sort === "best"
                      ? "bg-moss border-moss text-white font-medium shadow-none"
                      : "bg-white border-line text-forest-soft hover:bg-sage-2"
                  } ${!hasCandidateEmbedding ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={!hasCandidateEmbedding ? "Requires a saved resume profile to calculate matches" : ""}
                >
                  Best match
                </Link>
              )}
              <Link
                href={getFilterUrl({ sort: "newest", page: 1 })}
                className={`px-4 py-1.5 text-xs rounded-full border transition-all ${
                  sort !== "best"
                    ? "bg-moss border-moss text-white font-medium shadow-none"
                    : "bg-white border-line text-forest-soft hover:bg-sage-2"
                }`}
              >
                Newest
              </Link>
            </div>
          </div>

          {/* Employment Type Filter (Checklist checkboxes) */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-forest-soft uppercase tracking-wider">Employment type</h4>
            <div className="space-y-2.5">
              {[
                { label: "Full-time", value: "FULL_TIME" },
                { label: "Contract", value: "CONTRACT" },
                { label: "Internship", value: "INTERNSHIP" },
              ].map((item) => {
                const isActive = (employmentType || "ALL") === item.value
                return (
                  <Link
                    key={item.value}
                    href={getToggleChecklistUrl("employmentType", employmentType || "ALL", item.value)}
                    className="flex items-center gap-2.5 text-xs text-forest-soft hover:text-forest transition-colors font-medium"
                  >
                    <div
                      className={`w-4 h-4 rounded-[4px] border border-line flex items-center justify-center transition-all ${
                        isActive ? "bg-moss border-moss" : "bg-white"
                      }`}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Work Mode Filter (Checklist checkboxes) */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-forest-soft uppercase tracking-wider">Work mode</h4>
            <div className="space-y-2.5">
              {[
                { label: "Remote", value: "REMOTE" },
                { label: "Hybrid", value: "HYBRID" },
                { label: "On-site", value: "ON_SITE" },
              ].map((item) => {
                const isActive = (workMode || "ALL") === item.value
                return (
                  <Link
                    key={item.value}
                    href={getToggleChecklistUrl("workMode", workMode || "ALL", item.value)}
                    className="flex items-center gap-2.5 text-xs text-forest-soft hover:text-forest transition-colors font-medium"
                  >
                    <div
                      className={`w-4 h-4 rounded-[4px] border border-line flex items-center justify-center transition-all ${
                        isActive ? "bg-moss border-moss" : "bg-white"
                      }`}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Minimum Match Filter (Chips) */}
          {session?.user?.role === "CANDIDATE" && hasCandidateEmbedding && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-forest-soft uppercase tracking-wider">Minimum Match</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Any", value: "" },
                  { label: "70%+", value: "70" },
                  { label: "85%+", value: "85" },
                ].map((item) => {
                  const isActive = (minMatch || "") === item.value
                  return (
                    <Link
                      key={item.label}
                      href={getFilterUrl({ minMatch: item.value, page: 1 })}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        isActive
                          ? "bg-moss border-moss text-white font-medium"
                          : "bg-white border-line text-forest-soft hover:bg-sage-2"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Results Section */}
        <div className="md:col-span-9 space-y-4">
          <div className="flex justify-between items-baseline mb-4 border-b border-line pb-2">
            <div className="text-xl font-serif font-medium text-forest">
              {pagination.totalItems} roles matched to you
            </div>
            <div className="text-xs text-forest-soft font-medium">
              Sorted by {sort === "best" ? "best match" : "newest posted"}
            </div>
          </div>

          {/* Listings List */}
          <div className="space-y-3.5">
            {jobs.length === 0 ? (
              <div className="text-center p-16 bg-sage-2 rounded-[14px] border border-transparent">
                <p className="text-sm text-forest-soft mb-2">No jobs match your filter specifications.</p>
                <Link href="/jobs" className="text-xs font-semibold text-moss hover:underline">
                  Clear all filters and search again
                </Link>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-line rounded-[14px] p-5 flex gap-[18px] items-center transition-all shadow-none group"
                >
                  {/* Conic Ring Match Score on the LEFT */}
                  <MatchStamp score={job.matchScore ?? 0} className="w-[60px] h-[60px] text-[13px]" innerBgClass="bg-white" />

                  {/* Middle Details */}
                  <div className="flex-grow space-y-1">
                    <h3 className="font-serif text-lg font-medium text-forest group-hover:text-moss transition-colors leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-xs text-forest-soft font-medium leading-none">
                      {job.companyName} · {job.location || "Remote"}
                    </p>

                    {/* Skill highlight tags */}
                    <div className="tags flex gap-1.5 flex-wrap pt-2">
                      {job.skillsRequired.map((skill: string) => (
                        <span
                          key={skill}
                          className="tag text-[11px] px-2.5 py-1 bg-sage-2 rounded-full text-forest-soft font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Side Metadata */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    <div className="space-y-0.5">
                      <div className="salary font-serif text-[15px] font-medium text-forest leading-none">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                      <div className="place text-[12px] text-forest-soft font-medium">
                        {job.location && job.location.toLowerCase().includes("remote") ? "Remote" : "On-site"}
                      </div>
                    </div>
                    
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors block text-center mt-3"
                    >
                      View role
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === pagination.page
                return (
                  <Link
                    key={p}
                    href={getFilterUrl({ page: p })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isCurrent
                        ? "bg-moss text-white shadow-none"
                        : "bg-transparent text-forest-soft hover:bg-sage-2"
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
