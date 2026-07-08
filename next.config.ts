import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers has no free image-optimization service; the site is
  // text-first so unoptimized images cost us nothing real.
  images: { unoptimized: true },
};

export default nextConfig;

// Enable Cloudflare bindings (KV, secrets) during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
