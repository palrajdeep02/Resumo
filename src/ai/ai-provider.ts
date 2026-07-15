import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"

/**
 * Returns a configured LanguageModel instance from Vercel AI SDK.
 * Prioritizes GEMINI_API_KEY (using gemini-1.5-flash) and falls back
 * to OPENAI_API_KEY (using gpt-4o-mini).
 */
export function getLanguageModel() {
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (groqKey) {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
    })
    return (groq as any)("llama-3.3-70b-versatile", {
      structuredOutputs: false,
    })
  }

  if (openaiKey) {
    const openai = createOpenAI({
      apiKey: openaiKey,
    })
    return openai("gpt-4o-mini")
  }

  if (geminiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: geminiKey,
    })
    return google("gemini-flash-latest")
  }

  throw new Error(
    "AI Provider Config Error: Please specify GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY in your .env file."
  )
}

/**
 * Returns a configured EmbeddingModel instance from Vercel AI SDK.
 * Prioritizes GROQ_API_KEY (using nomic-embed-text) and GEMINI_API_KEY (using gemini-embedding-2).
 */
export function getEmbeddingModel() {
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (groqKey) {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
    })
    return groq.embedding("nomic-embed-text")
  }

  if (geminiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: geminiKey,
    })
    return google.textEmbeddingModel("gemini-embedding-2")
  }

  if (openaiKey) {
    const openai = createOpenAI({
      apiKey: openaiKey,
    })
    return openai.embedding("text-embedding-3-small")
  }

  throw new Error(
    "AI Provider Config Error: Please specify GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY in your .env file."
  )
}
