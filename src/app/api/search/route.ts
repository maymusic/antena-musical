import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return Response.json({ artists: [], tracks: [] });

  const like = `%${q}%`;

  const foundArtists = await db
    .select({
      id: artists.id,
      slug: artists.slug,
      name: artists.name,
      tagline: artists.tagline,
      city: artists.city,
      genres: artists.genres,
      accent: artists.accent,
      coverUrl: artists.coverUrl,
      avatarUrl: artists.avatarUrl,
      verificationStatus: artists.verificationStatus,
    })
    .from(artists)
    .where(
      or(
        ilike(artists.name, like),
        ilike(artists.city, like),
        ilike(artists.tagline, like),
        sql`EXISTS (SELECT 1 FROM unnest(${artists.genres}) g WHERE g ILIKE ${like})`
      )
    )
    .limit(12);

  const foundTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      platform: tracks.platform,
      url: tracks.url,
      plays: tracks.plays,
      artistName: artists.name,
      artistSlug: artists.slug,
      accent: artists.accent,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(and(eq(artists.moderationStatus, "active"), or(ilike(tracks.title, like), ilike(artists.name, like))))
    .limit(20);

  return Response.json({ artists: foundArtists, tracks: foundTracks });
}
