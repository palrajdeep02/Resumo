const { PrismaClient } = require("./src/generated/prisma")
const db = new PrismaClient()

async function run() {
  console.log("Checking database embeddings...")
  const res = await db.$queryRawUnsafe('SELECT id, "userId", (embedding IS NULL) as "isNull" FROM "CandidateProfile"')
  console.log("Candidate Profiles Embeddings status:", res)

  const jobs = await db.$queryRawUnsafe('SELECT id, title, (embedding IS NULL) as "isNull" FROM "Job"')
  console.log("Jobs Embeddings status:", jobs)

  await db.$disconnect()
}

run().catch(console.error)
