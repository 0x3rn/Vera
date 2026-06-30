import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "firebase-admin"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://firestore.googleapis.com https://www.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.lemonsqueezy.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'self' https://www.google.com https://*.firebaseapp.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
