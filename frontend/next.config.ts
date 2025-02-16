import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  env: {
    NEXT_PUBLIC_SCHEDULE_SERVER: "http://api.vutler.io",
    //NEXT_PUBLIC_SCHEDULE_SERVER: "http://127.0.0.1:4000",
    NEXT_PUBLIC_DEVICE_SERVER: "http://api.vutler.io",
  },
};

export default nextConfig;
