import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://antenamusical.com";
  const rows = await db.select({ slug: artists.slug }).from(artists);

  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${base}/radio`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${base}/buscar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/crear`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...rows.map((r) => ({
      url: `${base}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...rows.map((r) => ({
      url: `${base}/${r.slug}/radio`,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 0.7,
    })),
  ];
}
