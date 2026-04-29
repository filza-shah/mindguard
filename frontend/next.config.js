/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build — more efficient Docker image
  output: "standalone",

  // Environment variables that should be available client-side
  // (prefixed with NEXT_PUBLIC_)
  env: {
    NEXT_PUBLIC_APP_NAME: "MindGuard",
  },
};

module.exports = nextConfig;
