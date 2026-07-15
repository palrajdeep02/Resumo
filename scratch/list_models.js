const fs = require("fs")
const path = require("path")

async function run() {
  const envPath = path.join(__dirname, "..", ".env")
  let apiKey = process.env.GEMINI_API_KEY
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/)
    if (match) {
      apiKey = match[1]
    }
  }

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in .env")
    return
  }

  console.log("Querying Google AI Studio models...")
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await res.json()
    if (data.error) {
      console.error("API Error Response:")
      console.error(JSON.stringify(data.error, null, 2))
    } else if (data.models) {
      console.log("\nAvailable Models:")
      data.models.forEach((m) => {
        console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`)
      })
    } else {
      console.log("Unexpected API Response structure:", data)
    }
  } catch (err) {
    console.error("Fetch failed:", err.message)
  }
}

run()
