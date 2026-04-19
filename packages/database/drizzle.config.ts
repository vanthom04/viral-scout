import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  // Dùng local SQLite cho drizzle-kit generate
  // D1 production dùng wrangler d1 migrations apply
  dbCredentials: {
    url: ".wrangler/state/v3/d1/viral-scout-db/db.sqlite"
  }
})
