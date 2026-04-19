import { eq, desc, sql } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"

import { cronLogs } from "../schema"
import type * as schema from "../schema"

type DB = DrizzleD1Database<typeof schema>

export const insertCronLog = async (db: DB, data: schema.NewCronLog) =>
  db.insert(cronLogs).values(data)

// Lấy 10 log gần nhất của 1 source
export const getRecentLogsForSource = async (db: DB, sourceId: string, limit = 10) =>
  db
    .select()
    .from(cronLogs)
    .where(eq(cronLogs.sourceId, sourceId))
    .orderBy(desc(cronLogs.runAt))
    .limit(limit)

// Health overview: mỗi source → lần chạy gần nhất
export const getJobHealthSummary = async (db: DB) =>
  db
    .select({
      sourceId: cronLogs.sourceId,
      lastRunAt: sql<string>`max(${cronLogs.runAt})`,
      lastStatus: cronLogs.status,
      totalScraped: sql<number>`sum(${cronLogs.postsScraped})`,
      totalAnalyzed: sql<number>`sum(${cronLogs.postsAnalyzed})`
    })
    .from(cronLogs)
    .groupBy(cronLogs.sourceId)
