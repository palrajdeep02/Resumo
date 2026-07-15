import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import JobDetailClient from "./job-detail-client"

export const dynamic = "force-dynamic"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const session = await auth()
  const { id } = await params

  const job = await db.job.findUnique({
    where: { id },
    include: {
      company: {
        select: { name: true, logoUrl: true },
      },
    },
  })

  if (!job) {
    notFound()
  }

  // Check if candidate already applied
  let alreadyApplied = false
  if (session?.user?.id && session.user.role === "CANDIDATE") {
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (candidate) {
      const app = await db.application.findUnique({
        where: {
          jobId_candidateId: {
            jobId: job.id,
            candidateId: candidate.id,
          },
        },
      })
      if (app) {
        alreadyApplied = true
      }
    }
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
    company: {
      name: job.company.name,
      logoUrl: job.company.logoUrl,
    },
  }

  return (
    <JobDetailClient
      job={serializedJob}
      userRole={session?.user?.role}
      alreadyApplied={alreadyApplied}
    />
  )
}
