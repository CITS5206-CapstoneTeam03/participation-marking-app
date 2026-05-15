import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/users/",
        destination: "http://127.0.0.1:8000/api/users/",
      },
      {
        source: "/api/workshops/",
        destination: "http://127.0.0.1:8000/api/workshops/",
      },
      {
        source: "/api/students/",
        destination: "http://127.0.0.1:8000/api/students/",
      },
      {
        source: "/api/marks/",
        destination: "http://127.0.0.1:8000/api/marks/",
      },
      {
        source: "/api/enabled-weeks/",
        destination: "http://127.0.0.1:8000/api/enabled-weeks/",
      },
      {
        source: "/api/system-config/",
        destination: "http://127.0.0.1:8000/api/system-config/",
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
