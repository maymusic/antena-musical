import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/baseurl";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/logout"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
