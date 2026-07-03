import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sozlamani experimental ichidan tashqariga chiqardik
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;