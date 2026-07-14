import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not defined in the environment. Database operations may fail.");
}

const client = postgres(connectionString || "postgres://localhost:5432/resumo", {
  prepare: false,
  max: 1, // Restrict to 1 connection per serverless function instance to prevent pool saturation
});

export const db = drizzle(client, { schema });
