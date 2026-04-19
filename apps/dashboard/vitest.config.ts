import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

const alias = { "@": resolve(__dirname, "./src") }

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"]
        }
      },
      {
        resolve: { alias },
        test: {
          name: "node",
          include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
          environment: "node",
          globals: true
        }
      }
    ]
  }
})
