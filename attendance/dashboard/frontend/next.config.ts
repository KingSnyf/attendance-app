import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.localhost" },
    ],
  },
}

export default nextConfig
