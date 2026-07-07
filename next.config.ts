import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers has no free image-optimization service; the site is
  // text-first so unoptimized images cost us nothing real.
  images: { unoptimized: true },
};

export default nextConfig;
