"use server"

import { headers } from "next/headers"
import { revalidateTag } from "next/cache"
import { getDb } from "@/lib/db"
import { getAuth } from "@/lib/auth"
import { savedIdeas } from "@viral-scout/database"

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

export const savePostAction = async (
  postId: string,
  notes?: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return { success: false, error: "Unauthorized" }

    const db = await getDb()
    const id = crypto.randomUUID()

    await db.insert(savedIdeas).values({
      id,
      userId: session.user.id,
      postId,
      notes: notes ?? null,
      status: "draft"
    })

    revalidateTag("saved-ideas", "default")
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: "Failed to save, please try again" }
  }
}
