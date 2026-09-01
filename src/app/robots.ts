import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/contact", "/privacy", "/terms", "/pricing"], disallow: ["/dashboard", "/api"] },
    sitemap: "https://verahq.xyz/sitemap.xml",
  };
}
