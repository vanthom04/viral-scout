import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/trending", "/analytics", "/monitor", "/idea-generator"]

// Cookie name Better Auth dùng mặc định
const SESSION_COOKIE = "better-auth.session_token"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (!isProtected) {
    return NextResponse.next()
  }

  // Kiểm tra session cookie — full validation xảy ra ở Server Component
  const hasSession = request.cookies.has(SESSION_COOKIE)

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"]
}
