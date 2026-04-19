@AGENTS.md

# apps/dashboard — CLAUDE.md

Next.js 16 app chạy trên Cloudflare Workers via `@opennextjs/cloudflare`. Đọc root `CLAUDE.md` trước.

## Entry Points

| File                  | Mô tả                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| `worker.ts`           | Cloudflare Worker entry — `fetch` (Next.js) + `scheduled` (cron fan-out) |
| `src/proxy.ts`        | Route guard Next.js 16 — bảo vệ `/dashboard/*`                           |
| `src/app/layout.tsx`  | Root layout — font, Sonner Toaster                                       |
| `src/app/globals.css` | Tailwind v4 CSS-first config + shadcn theme tokens                       |

## Cấu trúc src/

```
src/
├── app/
│   ├── (auth)/login/         # Trang login — redirect nếu đã login
│   ├── (dashboard)/          # Protected routes — layout có Sidebar
│   │   ├── trending/         # Feed bài viral + filter
│   │   ├── idea-generator/   # AI gen hook/script từ post
│   │   ├── analytics/        # Charts virality + top tags
│   │   └── monitor/          # Health cron jobs
│   └── api/
│       ├── auth/[...all]/    # Better Auth handler
│       └── generate-idea/    # SSE streaming Workers AI
├── components/
│   └── layouts/              # DashboardSidebar (shadcn Sidebar)
├── db/
│   └── auth-schema.ts        # Drizzle schema cho Better Auth tables
├── features/                 # Domain modules — mỗi feature tự chứa
│   ├── auth/                 # LoginForm
│   ├── posts/                # PostFeed, PostCard, TagFilterBar, ViralityBadge
│   ├── idea-generator/       # IdeaGeneratorForm, IdeaResultStream
│   └── analytics/            # Analytics queries
└── lib/
    ├── auth.ts               # Better Auth server — singleton factory
    ├── auth-client.ts        # Better Auth client — signIn, signOut, useSession
    ├── db.ts                 # getDb() — Drizzle D1 instance
    └── utils.ts              # cn() utility
```

## Better Auth Setup

Auth chỉ **đăng nhập**, **không đăng ký** — tài khoản được tạo thủ công qua Better Auth admin API.

```typescript
// src/lib/auth.ts — singleton pattern vì OpenNext async
export const getAuth = async () => {
  if (authInstance) return authInstance
  const { env } = await getCloudflareContext({ async: true })
  // ...
}
```

```typescript
// emailAndPassword: { disableSignUp: true }  ← quan trọng
```

Route handler: `src/app/api/auth/[...all]/route.ts`

```typescript
const auth = await getAuth()
export const { GET, POST } = toNextJsHandler(auth)
```

## Getting Cloudflare Context

**Luôn dùng `getCloudflareContext`** — không dùng `process.env` cho D1/AI/Queue:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare"

const { env } = await getCloudflareContext({ async: true })
const db = drizzle(env.DB, { schema })
```

Helper shortcut: `src/lib/db.ts`

```typescript
const db = await getDb() // wraps getCloudflareContext + drizzle
```

## shadcn/ui Components

Xem danh sách components tại [packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md).

## API Routes

### `POST /api/generate-idea`

Stream Workers AI để gen hook/script từ 1 post. Trả về `text/event-stream` (SSE).

Request body:

```typescript
{ title: string; body: string; platform: string; contentType: string; hookAngles: string[] }
```

Response: SSE events dạng `data: {"response": "..."}\n\n`

### `GET|POST /api/auth/[...all]`

Tất cả Better Auth endpoints — login, logout, session.

## Feature: posts

| File                            | Mô tả                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| `queries.ts`                    | `fetchViralPosts`, `fetchPostById` — wrap DB queries       |
| `actions.ts`                    | `savePostAction` — Server Action lưu bài                   |
| `components/post-feed.tsx`      | Client Component — filter state + render list              |
| `components/post-card.tsx`      | Hiển thị 1 post — platform badge, virality, hooks, actions |
| `components/tag-filter-bar.tsx` | Toggle platform/virality/tag filters                       |
| `components/virality-badge.tsx` | Badge màu theo score (🔥/⚡/muted)                         |

## Feature: idea-generator

Stream từ Workers AI về client qua SSE. Flow:

1. User vào `/dashboard/idea-generator?postId=xxx`
2. Server Component fetch post từ D1
3. Client render `IdeaGeneratorForm` với post info
4. User click "Tạo ý tưởng" → fetch `/api/generate-idea`
5. `IdeaResultStream` đọc SSE stream realtime, render Markdown

## Environment Variables (`.dev.vars`)

```bash
BETTER_AUTH_SECRET=       # Min 32 chars — openssl rand -hex 32
BETTER_AUTH_URL=          # http://localhost:3000

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
YOUTUBE_API_KEY=
TWITTER_BEARER_TOKEN=
TIKTOK_API_KEY=
FACEBOOK_ACCESS_TOKEN=    # Optional
PROXYCURL_API_KEY=        # Optional (LinkedIn)
```

## Next.js 16 Gotchas

```typescript
// ✅ Đúng — await params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// ✅ Đúng — proxy.ts, export proxy
export function proxy(request: NextRequest) { ... }

// ✅ Đúng — explicit cache
async function getData() {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  return db.select()...;
}
```

## Deployment

```bash
# Build + preview local (CF environment)
pnpm preview

# Deploy production
pnpm deploy
# = opennextjs-cloudflare build && opennextjs-cloudflare deploy
```
