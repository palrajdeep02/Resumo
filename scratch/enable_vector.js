const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

async function run() {
  // Read .env file manually to support zero dependencies
  const envPath = path.join(__dirname, "..", ".env")
  let connectionString = process.env.DATABASE_URL
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)
    if (match) {
      connectionString = match[1]
    }
  }

  if (!connectionString) {
    console.error("Error: DATABASE_URL not found in environment or .env file.")
    process.exit(1)
  }

  console.log("Connecting to database...")
  const client = new Client({ connectionString })
  await client.connect()
  console.log("Connected. Enabling vector extension...")
  await client.query("CREATE EXTENSION IF NOT EXISTS vector;")
  console.log("pgvector extension enabled successfully!")
  await client.end()
}

run().catch(console.error)
