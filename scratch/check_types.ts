import { generateObject } from "ai"
import { z } from "zod"

// This script is just to see if TypeScript complains and what properties it exposes
const typeCheckTest = {
  model: {} as any,
  schema: z.object({}),
  // Let's see what properties are in GenerateObjectOptions
}
console.log("Checking import...")
