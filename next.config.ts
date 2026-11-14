import type { NextConfig } from "next"

import "./src/env"

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    authInterrupts: true,
  },
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig
