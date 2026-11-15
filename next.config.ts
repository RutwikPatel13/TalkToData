import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image runs Next's self-contained server, so the Dockerfile sets
  // this flag. It stays unset everywhere else on purpose: `next start` and
  // Vercel both expect the normal build output.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
};

export default nextConfig;
