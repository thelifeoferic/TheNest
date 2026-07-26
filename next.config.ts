import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Vercel and local builds scoped to The Nest when this folder lives
  // inside a larger workspace containing other lockfiles and TypeScript apps.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    tsconfigPath: "tsconfig.vercel.json",
  },
};

export default nextConfig;
