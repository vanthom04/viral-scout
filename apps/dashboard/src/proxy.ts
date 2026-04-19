import { NextResponse, type NextRequest } from "next/server"

import { getAuth } from "@/lib/auth"

const PROTECTED_PREFIXES = ["/trending", "/analytics", "/monitor", "/idea-generator"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (!isProtected) {
    return NextResponse.next()
  }

  const auth = await getAuth()
  const session = await auth.api.getSession({
    headers: request.headers
  })

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    // Redirect to root after login
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"]
}
