import { type NextConfig } from "next"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev({ remoteBindings: false })

const nextConfig: NextConfig = {
  transpilePackages: ["@viral-scout/ui"],
  reactCompiler: true,
  cacheComponents: true,
  images: {},
  devIndicators: {
    position: "bottom-right"
  }
}

export default nextConfig
