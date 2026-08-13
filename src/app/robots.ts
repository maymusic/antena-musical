import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://antenamusical.com";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/logout"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
