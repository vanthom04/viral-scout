import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getAuth } from "@/lib/auth"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata = {
  title: "Login"
}

// This component will handle dynamic logic
async function AuthCheck() {
  const auth = await getAuth()
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (session) {
    redirect("/trending")
  }

  return null
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background w-full">
      {/* In Next.js 15+, calling headers() at the root will make the page dynamic.
        Use Suspense to wrap AuthCheck() - the component that calls headers() */}
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>

      <div className="w-full max-w-sm space-y-6">
        {/* Logo + heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 font-display">
            V
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight font-display">Viral Scout</h1>
            <p className="text-sm text-muted-foreground">Content Intelligence Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm border-border/50">
          <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground">
            Only authorized accounts can log in
        </p>
      </div>
    </main>
  )
}
