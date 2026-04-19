import type { Metadata } from "next"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Roboto, Poppins, Inconsolata } from "next/font/google"

import { cn } from "@viral-scout/ui/lib/utils"
import { Toaster } from "@viral-scout/ui/components/sonner"
import { TooltipProvider } from "@viral-scout/ui/components/tooltip"
import { ThemeProvider } from "@/components/providers/theme-provider"

import "@viral-scout/ui/globals.css"

const fontSans = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-sans"
})

const fontDisplay = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-display"
})

const fontMono = Inconsolata({
  subsets: ["latin"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: {
    default: "Viral Scout",
    template: "%s — Viral Scout"
  },
  description: "Content intelligence platform — find viral content, generate ideas with AI"
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(
        "antialiased",
        fontSans.variable,
        fontDisplay.variable,
        fontMono.variable,
        "font-sans"
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body suppressHydrationWarning>
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="bottom-right" richColors />
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
