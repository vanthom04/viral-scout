import { getCloudflareContext } from "@opennextjs/cloudflare"
import { z } from "zod"

const requestSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(2000),
  platform: z.string(),
  contentType: z.string(),
  hookAngles: z.array(z.string())
})

const SYSTEM_PROMPT = `You are a top-tier content creator and copywriter.
Task: based on the provided viral post, generate a complete content idea to post on social media.

Follow this exact structure (use Markdown):

## 🎣 Opening Hook
[1-2 powerful hooks that provoke curiosity or hit a pain point]

## 📋 Content Outline
[List 4-5 main points with brief descriptions]

## ✍️ Social Media Caption
[Complete caption, optimized for Facebook/TikTok/X, around 150-200 words]

## 🎯 Call to Action
[Clear and specific CTA to drive engagement]

## 🖼️ Thumbnail/Cover Idea
[Short description of the thumbnail/cover image, colors, text overlay]

## #️⃣ Hashtags
[10-15 relevant hashtags]`

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return new Response("Invalid request", { status: 422 })
  }

  const { title, body: postBody, platform, contentType, hookAngles } = parsed.data

  const userMessage = `Original platform: ${platform}
Content type: ${contentType}
Viral post title: ${title}
Content: ${postBody.slice(0, 1000)}
Suggested hook angles: ${hookAngles.join(" | ")}

Please generate a complete content idea based on this viral post.`

  try {
    const { env } = await getCloudflareContext({ async: true })

    // Workers AI stream
    const aiStream = (await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      stream: true,
      max_tokens: 1000,
      temperature: 0.7
    })) as ReadableStream

    return new Response(aiStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    })
  } catch (error) {
    console.error("[generate-idea] AI error:", error)
    return new Response("AI service unavailable", { status: 503 })
  }
}
