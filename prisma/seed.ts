import { db } from "../src/lib/db"
import { faker } from "@faker-js/faker"

// Pre-hashed bcrypt password for 'password123'
const PASSWORD_HASH = "$2b$10$EPf9jYi1435M2k9av15dOO92Rk2d8e47H/Q5S7B29D386gV4w182."

function generateRandomVectorString(dimension = 1536): string {
  const arr = Array.from({ length: dimension }, () => (Math.random() * 2 - 1).toFixed(4))
  return `[${arr.join(",")}]`
}

async function main() {
  console.log("Seeding database...")

  // Enable pgvector extension
  await db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector")

  // Clean database
  await db.$executeRawUnsafe('TRUNCATE TABLE "User", "Company", "CandidateProfile", "RecruiterProfile", "Job", "Application", "Notification" CASCADE')

  // 1. Create Companies
  const companies = []
  for (let i = 0; i < 2; i++) {
    const company = await db.company.create({
      data: {
        name: faker.company.name(),
        website: faker.internet.url(),
        logoUrl: faker.image.urlLoremFlickr({ category: "business" }),
        description: faker.company.catchPhrase(),
      }
    })
    companies.push(company)
  }
  console.log(`Created ${companies.length} companies.`)

  // 2. Create Recruiters (3 recruiters)
  const recruiters = []
  for (let i = 0; i < 3; i++) {
    const user = await db.user.create({
      data: {
        email: `recruiter${i + 1}@example.com`,
        passwordHash: PASSWORD_HASH,
        role: "RECRUITER",
        name: faker.person.fullName(),
      }
    })
    
    // Recruiters belong to the first company (2 of them) and second company (1 of them)
    const companyId = companies[i % 2].id
    const recruiter = await db.recruiterProfile.create({
      data: {
        userId: user.id,
        companyId: companyId
      }
    })
    recruiters.push(recruiter)
  }
  console.log(`Created ${recruiters.length} recruiters.`)

  // 3. Create Candidates (10 candidates)
  const candidates = []
  const skillsPool = ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Python", "Docker", "AWS", "GraphQL", "Tailwind CSS", "Java", "Go", "Kubernetes"]
  
  for (let i = 0; i < 10; i++) {
    const user = await db.user.create({
      data: {
        email: `candidate${i + 1}@example.com`,
        passwordHash: PASSWORD_HASH,
        role: "CANDIDATE",
        name: faker.person.fullName(),
      }
    })

    const parsedSkills = faker.helpers.arrayElements(skillsPool, { min: 3, max: 6 })
    const experienceYears = faker.number.int({ min: 1, max: 15 })
    const education = [
      {
        degree: faker.helpers.arrayElement(["B.S. Computer Science", "M.S. Software Engineering", "B.Tech IT"]),
        institution: faker.company.name() + " University",
        year: faker.number.int({ min: 2010, max: 2024 })
      }
    ]

    const candidate = await db.candidateProfile.create({
      data: {
        userId: user.id,
        parsedSkills,
        experienceYears,
        education,
        bio: faker.lorem.paragraph(),
        resumeUrl: `https://example.com/resumes/candidate_${i + 1}.pdf`,
      }
    })

    // Update embedding using raw SQL
    const vectorStr = generateRandomVectorString()
    await db.$executeRawUnsafe(
      `UPDATE "CandidateProfile" SET "embedding" = $1::vector WHERE "id" = $2`,
      vectorStr,
      candidate.id
    )

    candidates.push(candidate)
  }
  console.log(`Created ${candidates.length} candidates.`)

  // 4. Create Jobs (8 jobs)
  const jobs = []
  for (let i = 0; i < 8; i++) {
    const company = companies[i % 2]
    const skillsRequired = faker.helpers.arrayElements(skillsPool, { min: 3, max: 6 })
    
    const job = await db.job.create({
      data: {
        companyId: company.id,
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraphs(2),
        skillsRequired,
        location: faker.location.city() + ", " + faker.location.state({ abbreviated: true }),
        employmentType: faker.helpers.arrayElement(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
        salaryMin: faker.number.int({ min: 50000, max: 100000 }),
        salaryMax: faker.number.int({ min: 110000, max: 200000 }),
        status: "PUBLISHED",
      }
    })

    // Update embedding using raw SQL
    const vectorStr = generateRandomVectorString()
    await db.$executeRawUnsafe(
      `UPDATE "Job" SET "embedding" = $1::vector WHERE "id" = $2`,
      vectorStr,
      job.id
    )

    jobs.push(job)
  }
  console.log(`Created ${jobs.length} jobs.`)

  // 5. Create some Applications
  for (let i = 0; i < 5; i++) {
    const job = jobs[i]
    const candidate = candidates[i]
    await db.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        status: "APPLIED",
        matchScore: parseFloat((Math.random() * 40 + 60).toFixed(2)),
        aiFitSummary: faker.lorem.sentences(2),
      }
    })
  }
  console.log("Created 5 initial job applications.")

  console.log("Seeding completed successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
