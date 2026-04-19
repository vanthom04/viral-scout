import type { CloudflareEnv } from "@viral-scout/types"
import type { AIAnalysisResult } from "@viral-scout/types"
import type { AIAnalyzeInput, AIAnalyzeRawOutput } from "@viral-scout/types"

import { isValidAIOutput, toAnalysisResult } from "@viral-scout/types"

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích content viral cho thị trường Việt Nam.
Nhiệm vụ: phân tích bài đăng mạng xã hội và trả về JSON.

Trả về ĐÚNG format JSON sau, KHÔNG có text ngoài JSON:
{
  "virality_score": <số từ 1.0 đến 10.0>,
  "content_type": <"story"|"list"|"proof"|"rant"|"how-to"|"question"|"news">,
  "hook_angles": [<3 góc khai thác content tiếng Việt>],
  "script_outline": <outline video/bài viết nếu score >= 7, null nếu không>,
  "suggested_tags": [<1-4 tags từ danh sách được phép>],
  "reasoning": <lý do ngắn gọn tại sao cho điểm này>
}

Tags được phép: thu-nhap-thu-dong, tu-do-tai-chinh, x2-x3-thu-nhap, thu-nhap-cao,
dong-tien, kiem-tien-online, personal-brand, cau-chuyen-thuong-hieu, loi-chao-hang,
content-viral, viral-trieu-view, xay-kenh, quay-video, fanpage, followers.

Tiêu chí virality_score:
9-10: Hook cực mạnh, câu chuyện cá nhân + số liệu cụ thể, gây tranh cãi tích cực
7-8:  Angle rõ ràng, proof hoặc list hữu ích, engagement cao
5-6:  Nội dung ổn nhưng thiếu hook hoặc proof
1-4:  Generic, không có angle rõ, ít engagement

Bài không liên quan đến tài chính cá nhân / content / kiếm tiền → score 1-2.`

export const analyzePost = async (
  env: CloudflareEnv,
  input: AIAnalyzeInput
): Promise<AIAnalysisResult | null> => {
  const userMessage = `Platform: ${input.platform}
Tiêu đề: ${input.title}
Nội dung: ${input.body.slice(0, 1500)}
Engagement: ${input.engagementStats.likes} likes, ${input.engagementStats.comments} comments, ${input.engagementStats.shares} shares, ${input.engagementStats.views} views`

  try {
    // @ts-expect-error — Workers AI types vary by version
    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3, // Low temp → consistent JSON output
      max_tokens: 600
    })

    const rawText: string =
      typeof response === "string" ? response : ((response as { response?: string }).response ?? "")

    // Tìm JSON block trong response (phòng khi AI thêm text ngoài JSON)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[analyzer] No JSON found in AI response:", rawText.slice(0, 200))
      return null
    }

    const parsed: unknown = JSON.parse(jsonMatch[0])

    if (!isValidAIOutput(parsed)) {
      console.error("[analyzer] Invalid AI output shape:", parsed)
      return null
    }

    return toAnalysisResult(parsed as AIAnalyzeRawOutput)
  } catch (error) {
    console.error("[analyzer] Error calling Workers AI:", error)
    return null
  }
}

// Classifier nhẹ: dùng model nhỏ để lọc off-topic trước khi gọi 70b
export const isRelevantPost = async (env: CloudflareEnv, title: string): Promise<boolean> => {
  try {
    // @ts-expect-error Workers AI run() types do not include all model IDs
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: "Trả lời chỉ \"yes\" hoặc \"no\". Bài này có liên quan đến: kiếm tiền, tài chính cá nhân, thu nhập, content creator, personal brand, mạng xã hội, viral, dòng tiền không?"
        },
        { role: "user", content: title }
      ],
      max_tokens: 5,
      temperature: 0
    })

    const text: string =
      typeof response === "string"
        ? response.toLowerCase()
        : ((response as { response?: string }).response ?? "").toLowerCase()

    return text.includes("yes")
  } catch {
    // Nếu classifier lỗi → pass through để 70b xử lý
    return true
  }
}
