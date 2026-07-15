const fs = require("fs")
const path = require("path")

async function testLanguageModel(apiKey, modelName) {
  console.log(`\nTesting Language Model: ${modelName}...`)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond in 3 words: I am functional" }] }],
      }),
    })
    const data = await res.json()

    if (data.error) {
      console.log(`❌ Fail: ${data.error.message}`)
      return false
    } else if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts[0]
    ) {
      console.log(`✅ Success! Response: "${data.candidates[0].content.parts[0].text.trim()}"`)
      return true
    } else {
      console.log("❌ Fail: Unexpected response structure", data)
      return false
    }
  } catch (err) {
    console.log(`❌ Fail: Fetch error - ${err.message}`)
    return false
  }
}

async function testEmbeddingModel(apiKey, modelName) {
  console.log(`\nTesting Embedding Model: ${modelName}...`)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: "test embedding text" }] },
      }),
    })
    const data = await res.json()

    if (data.error) {
      console.log(`❌ Fail: ${data.error.message}`)
      return false
    } else if (data.embedding && data.embedding.values) {
      console.log(`✅ Success! Generated embedding with ${data.embedding.values.length} dimensions.`)
      return true
    } else {
      console.log("❌ Fail: Unexpected response structure", data)
      return false
    }
  } catch (err) {
    console.log(`❌ Fail: Fetch error - ${err.message}`)
    return false
  }
}

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

  console.log("Starting model testing suite...")

  // Test various models to see which one works on the user's key
  const languageModels = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"]
  for (const m of languageModels) {
    await testLanguageModel(apiKey, m)
  }

  const embeddingModels = ["gemini-embedding-2", "gemini-embedding-001"]
  for (const m of embeddingModels) {
    await testEmbeddingModel(apiKey, m)
  }
}

run()
