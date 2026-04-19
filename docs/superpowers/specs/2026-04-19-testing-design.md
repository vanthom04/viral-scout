# Test Strategy — Viral Scout Dashboard

**Date:** 2026-04-19  
**Scope:** `apps/dashboard`  
**Goal:** Đảm bảo business logic, UI components, và API routes hoạt động đúng trước khi deploy production.

---

## 1. Framework & Dependencies

| Package | Mục đích |
|---------|---------|
| `vitest` | Test runner — TypeScript native, nhanh |
| `@vitejs/plugin-react` | JSX transform trong Vitest |
| `jsdom` | DOM environment cho component tests |
| `@testing-library/react` | Render và query React components |
| `@testing-library/user-event` | Simulate user interactions |
| `@testing-library/jest-dom` | Custom matchers (`toBeInTheDocument`, v.v.) |
| `better-sqlite3` + `@types/better-sqlite3` | In-memory SQLite cho integration tests |

---

## 2. Vitest Config

**File:** `apps/dashboard/vitest.config.ts`

- Hai môi trường riêng biệt:
  - `jsdom` cho files `**/*.test.tsx` — component tests
  - `node` cho files `**/*.test.ts` — unit và integration tests
- Global setup: `vitest.setup.ts` import `@testing-library/jest-dom`
- Path aliases map theo `tsconfig.json` (`@/` → `src/`)

---

## 3. Test Helpers

**`tests/helpers/db.ts`** — Tạo in-memory SQLite DB với schema thật:

```typescript
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "@viral-scout/database"

export const createTestDb = () => {
  const sqlite = new Database(":memory:")
  const db = drizzle(sqlite, { schema })
  // Apply schema via SQL statements từ @viral-scout/database migrations
  return db
}
```

Mỗi test file gọi `createTestDb()` riêng để đảm bảo isolation.

**`tests/helpers/mocks.ts`** — Shared mock factories:

```typescript
// Mock Cloudflare context
export const mockCloudflareContext = (overrides?) =>
  vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: vi.fn().mockResolvedValue({
      env: { DB: createTestDb(), AI: mockAI, ...overrides }
    })
  }))

// Mock authenticated session
export const mockAuthSession = (user = { id: "user_1", email: "test@example.com" }) =>
  vi.mock("@/lib/auth", () => ({
    getAuth: vi.fn().mockResolvedValue({
      api: { getSession: vi.fn().mockResolvedValue({ user }) }
    })
  }))

// Mock unauthenticated
export const mockNoSession = () =>
  vi.mock("@/lib/auth", () => ({
    getAuth: vi.fn().mockResolvedValue({
      api: { getSession: vi.fn().mockResolvedValue(null) }
    })
  }))

// Mock Workers AI stream
export const mockAI = {
  run: vi.fn().mockResolvedValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: {\"response\": \"test\"}\n\n"))
        controller.close()
      }
    })
  )
}

// Mock auth client (cho component tests)
export const mockAuthClient = () =>
  vi.mock("@/lib/auth-client", () => ({
    signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
    signOut: vi.fn(),
    useSession: vi.fn().mockReturnValue({ data: null })
  }))
```

---

## 4. Cấu Trúc File Tests

```
apps/dashboard/
├── vitest.config.ts
├── vitest.setup.ts
├── tests/
│   └── helpers/
│       ├── db.ts
│       └── mocks.ts
└── src/
    ├── proxy.test.ts
    ├── features/
    │   ├── posts/
    │   │   ├── actions.test.ts
    │   │   └── components/
    │   │       ├── virality-badge.test.tsx
    │   │       ├── post-card.test.tsx
    │   │       └── post-feed.test.tsx
    │   ├── auth/
    │   │   └── components/
    │   │       └── login-form.test.tsx
    │   ├── monitor/
    │   │   └── utils.test.ts
    │   └── analytics/
    │       └── queries.test.ts
    └── app/
        └── api/
            └── generate-idea/
                └── route.test.ts
```

---

## 5. Test Cases Chi Tiết

### Layer A — Unit Tests

#### `src/proxy.test.ts`
- `/trending` không có session → redirect `/login?callbackUrl=/trending`
- `/analytics` không có session → redirect với callbackUrl đúng
- `/trending` có session hợp lệ → `NextResponse.next()`
- `/login` (unprotected) → `NextResponse.next()` dù không có session
- `/` (root) → `NextResponse.next()` dù không có session
- `/idea-generator/` với trailing slash → vẫn bị guard

#### `features/monitor/utils.test.ts`
- `formatDuration(500)` → `"500ms"`
- `formatDuration(1500)` → `"1.5s"`
- `formatDuration(61000)` → `"1m 1s"`
- `formatRelativeTime` cho timestamp < 1h → `"X minutes ago"`
- `formatRelativeTime` cho timestamp > 24h → `"X days ago"`
- `STATUS_CONFIG.success.label` → `"Optimal"`
- `STATUS_CONFIG.partial.label` → `"Degraded"`
- `STATUS_CONFIG.failed.label` → `"Critical"`

---

### Layer B — Component Tests

#### `features/posts/components/virality-badge.test.tsx`
- Score `9.0` → render 🔥 + class orange
- Score `7.5` → render ⚡ + class yellow
- Score `5.0` → render không có icon đặc biệt + class muted
- Score `8.5` (boundary) → render 🔥

#### `features/posts/components/post-card.test.tsx`
- Render đủ: title, platform badge, authorHandle, viralityScore
- hookAngles JSON hợp lệ → hiển thị tối đa 2 angles
- hookAngles JSON lỗi → không crash, không hiển thị angles
- Click "Generate Ideas" → gọi `onGenerateIdea` với đúng `postId`
- Click bookmark → gọi `savePostAction(postId)`, khi thành công button disabled + toast success
- `savePostAction` trả lỗi → toast error, button không disabled

#### `features/posts/components/post-feed.test.tsx`
- Render đủ số posts từ `initialPosts`
- Filter platform → chỉ hiển thị posts đúng platform
- Filter minVirality `"8.5"` → chỉ hiển thị posts có score ≥ 8.5
- Kết hợp platform + virality filter → AND logic
- Không có posts sau filter → hiển thị empty state "No posts found"
- Click "Clear filters" → reset và hiển thị lại tất cả posts
- Click "Generate Ideas" trên card → `router.push("/idea-generator?postId=xxx")`

#### `features/auth/components/login-form.test.tsx`
- Submit email không hợp lệ → hiển thị validation error, không gọi `signIn.email`
- Submit password < 8 ký tự → hiển thị validation error
- Submit hợp lệ → gọi `signIn.email({ email, password })`
- `signIn.email` trả lỗi → hiển thị "Invalid email or password"
- Đang submit → button disabled + text "Logging in..."

---

### Layer C — Integration Tests

#### `features/posts/actions.test.ts`
- Không có session → `{ success: false, error: "Unauthorized" }`
- Có session + postId hợp lệ → insert vào `savedIdeas`, return `{ success: true, data: { id } }`
- DB lỗi → `{ success: false, error: "Failed to save, please try again" }`

#### `features/analytics/queries.test.ts`
- DB trống → `platformStats: []`, `topTags: []`, `viralityDistribution: []`
- Có seed data 3 posts từ reddit + youtube → `platformStats` có 2 entries đúng platform
- Top tags trả đúng slug + labelVi + postCount
- `viralityDistribution` bucket đúng theo `round(viralityScore)`

#### `app/api/generate-idea/route.test.ts`
- POST thiếu `title` → 400 JSON error
- POST `title` rỗng → 400 JSON error  
- POST body hợp lệ → response `Content-Type: text/event-stream`
- POST body hợp lệ → AI `run()` được gọi với đúng model + messages
- AI throw error → 500 response

---

## 6. Conventions

- Mỗi test file: `describe` block theo tên component/module
- Test name: `"nên [hành vi] khi [điều kiện]"` — tiếng Việt để nhất quán với codebase
- `beforeEach`: reset mocks với `vi.clearAllMocks()`
- Integration tests: `beforeEach` tạo DB mới, `afterEach` đóng connection
- Không test implementation detail — test behavior từ góc nhìn user/caller

---

## 7. Scripts

```json
// package.json (apps/dashboard)
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
