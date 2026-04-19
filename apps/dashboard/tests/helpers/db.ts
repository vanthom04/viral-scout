import initSqlJs from "sql.js"
import { drizzle } from "drizzle-orm/sql-js"
import { migrate } from "drizzle-orm/sql-js/migrator"
import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import * as schema from "@viral-scout/database"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(__dirname, "../../../../packages/database/migrations")
const SEED_SQL = resolve(MIGRATIONS_DIR, "0001_init_seed.sql")

/**
 * Khởi tạo in-memory SQLite DB với full schema + seed data.
 * Dùng trong tests — mỗi test suite gọi createTestDb() riêng để isolation.
 *
 * sql.js dùng WASM nên cần await để load engine trước.
 *
 * @returns { db, sqliteDb, cleanup } — db: Drizzle instance, sqliteDb: raw sql.js Database, cleanup: close function
 */
export const createTestDb = async () => {
  const SQL = await initSqlJs()
  const sqliteDb = new SQL.Database()
  const db = drizzle(sqliteDb, { schema })

  migrate(db, { migrationsFolder: MIGRATIONS_DIR })

  const seedSql = readFileSync(SEED_SQL, "utf-8")
  sqliteDb.exec(seedSql)

  return { db, sqliteDb, cleanup: () => sqliteDb.close() }
}
