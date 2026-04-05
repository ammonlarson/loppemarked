const API_DEV_URL = process.env.API_URL ?? "http://localhost:3001";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@greenspace/shared"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  async rewrites() {
    return [
      { source: "/health", destination: `${API_DEV_URL}/health` },
      { source: "/public/:path*", destination: `${API_DEV_URL}/public/:path*` },
      { source: "/admin/:path*", destination: `${API_DEV_URL}/admin/:path*` },
    ];
  },
};

export default nextConfig;
