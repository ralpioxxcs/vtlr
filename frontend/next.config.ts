import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  env: {
    NEXT_PUBLIC_SCHEDULE_SERVER: "http://api.vutler.local",
  },
};

export default nextConfig;
