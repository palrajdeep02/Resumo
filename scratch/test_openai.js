const fs = require("fs")
const path = require("path")

async function testOpenAILanguageModel(apiKey) {
  console.log("Testing OpenAI Language Model (gpt-4o-mini)...")
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Respond in 3 words: OpenAI is working" }],
      }),
    })
    const data = await res.json()

    if (data.error) {
      console.log(`❌ Fail: ${data.error.message}`)
      return false
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log(`✅ Success! Response: "${data.choices[0].message.content.trim()}"`)
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

async function testOpenAIEmbeddingModel(apiKey) {
  console.log("\nTesting OpenAI Embedding Model (text-embedding-3-small)...")
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: "test embedding text",
      }),
    })
    const data = await res.json()

    if (data.error) {
      console.log(`❌ Fail: ${data.error.message}`)
      return false
    } else if (data.data && data.data[0] && data.data[0].embedding) {
      console.log(`✅ Success! Generated embedding with ${data.data[0].embedding.length} dimensions.`)
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
  let apiKey = process.env.OPENAI_API_KEY
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    const match = envContent.match(/OPENAI_API_KEY=["']?([^"'\r\n]+)["']?/)
    if (match) {
      apiKey = match[1]
    }
  }

  if (!apiKey) {
    console.error("Error: OPENAI_API_KEY not found in .env")
    return
  }

  console.log("Starting OpenAI API key test...")
  const languageOk = await testOpenAILanguageModel(apiKey)
  const embeddingOk = await testOpenAIEmbeddingModel(apiKey)

  if (languageOk && embeddingOk) {
    console.log("\n🚀 Verification complete: OpenAI key is 100% working!")
  } else {
    console.log("\n⚠️ Verification finished with failures. Check errors above.")
  }
}

run()
