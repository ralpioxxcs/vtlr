import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  env: {
    // NEXT_PUBLIC_SCHEDULE_SERVER: "http://127.0.0.1:4004",
    // NEXT_PUBLIC_DEVICE_SERVER: "http://172.21.89.210:4001",
    // NEXT_PUBLIC_TTS_SERVER: "http://172.21.89.210:4002",
    NEXT_PUBLIC_DEVICE_SERVER: "http://api.vutler.io",
    NEXT_PUBLIC_SCHEDULE_SERVER: "http://api.vutler.io",
    NEXT_PUBLIC_TTS_SERVER: "http://api.vutler.io",
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
