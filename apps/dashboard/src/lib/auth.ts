import { drizzle } from "drizzle-orm/d1"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { getCloudflareContext } from "@opennextjs/cloudflare"

import * as authSchema from "@/db/auth-schema"

// Singleton — OpenNext creates a new instance per request if not cached
let authInstance: ReturnType<typeof createAuth> | null = null

const createAuth = (db: ReturnType<typeof drizzle>) =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        // Map Better Auth table names → drizzle schema
        user: authSchema.user,
        session: authSchema.session,
        account: authSchema.account,
        verification: authSchema.verification
      }
    }),

    emailAndPassword: {
      enabled: true,
      // Disable registration — only admins can create accounts via Better Auth admin API
      disableSignUp: true
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Refresh every 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5 // Cache cookie 5 mins
      }
    },

    plugins: [
      // Automatically handle Set-Cookie in Next.js App Router
      nextCookies()
    ]
  })

// Factory — lazy init, gets D1 binding from CF context each time
export const getAuth = async (): Promise<ReturnType<typeof createAuth>> => {
  if (authInstance) return authInstance

  const { env } = await getCloudflareContext({ async: true })
  const db = drizzle(env.DB, { schema: authSchema })

  authInstance = createAuth(db)
  return authInstance
}

// Export type cho auth client inference
export type Auth = ReturnType<typeof createAuth>
