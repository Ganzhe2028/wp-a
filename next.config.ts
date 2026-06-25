import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/api/settings": ["app/generated/prisma/libquery_engine-darwin-arm64.dylib.node", "app/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node"],
  },
};

export default nextConfig;
