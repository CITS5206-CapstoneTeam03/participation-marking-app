import type { NextConfig } from "next";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/users/",
        destination: `${apiBaseUrl}/users/`,
      },
      {
        source: "/api/workshops/",
        destination: `${apiBaseUrl}/workshops/`,
      },
      {
        source: "/api/students/",
        destination: `${apiBaseUrl}/students/`,
      },
      {
        source: "/api/marks/",
        destination: `${apiBaseUrl}/marks/`,
      },
      {
        source: "/api/enabled-weeks/",
        destination: `${apiBaseUrl}/enabled-weeks/`,
      },
      {
        source: "/api/system-config/",
        destination: `${apiBaseUrl}/system-config/`,
      },
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
