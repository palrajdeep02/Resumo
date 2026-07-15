import { db } from "@/lib/db"
import { assertCompanyOwnership } from "@/server/recruiter-actions"
import { notFound } from "next/navigation"
import EditJobForm from "./edit-form"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface EditJobPageProps {
  params: Promise<{ id: string }>
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const companyId = await assertCompanyOwnership()
  const { id } = await params

  const job = await db.job.findUnique({
    where: { id },
  })

  if (!job || job.companyId !== companyId) {
    notFound()
  }

  const serializedJob = {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    skillsRequired: job.skillsRequired,
    status: job.status,
  }

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-end pb-4 border-b border-line gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Edit Job Listing
            </h1>
            <p className="text-sm text-forest-soft mt-1">Modify details for your job posting</p>
          </div>
          <Link
            href="/dashboard/recruiter/jobs"
            className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors shrink-0"
          >
            Cancel
          </Link>
        </div>

        <EditJobForm job={serializedJob} />
      </div>
    </div>
  )
}
