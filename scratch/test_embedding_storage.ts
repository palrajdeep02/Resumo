import { generateAndStoreEmbedding } from "../src/ai/embeddings"

async function run() {
  console.log("Calling generateAndStoreEmbedding for candidate...")
  await generateAndStoreEmbedding("candidate", "213624fe-a86c-43ef-9a9e-196c339786ba")
  console.log("Finished execution.")
}

run().catch(console.error)
