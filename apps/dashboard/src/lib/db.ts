import { drizzle } from "drizzle-orm/d1"
import { cookies } from "next/headers"
import { getCloudflareContext } from "@opennextjs/cloudflare"

import * as schema from "@viral-scout/database"

export const getDb = async () => {
  // Gọi cookies() trước để Next.js 16 biết đây là dynamic route
  await cookies()
  const { env } = await getCloudflareContext({ async: true })
  return drizzle(env.DB, { schema })
}
