import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, playlistTracks, playlists, tracks } from "@/db/schema";

export async function getPlaylistDetail(userId: number, playlistId: number) {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1);

  if (!playlist || playlist.userId !== userId) return null;

  const items = await db
    .select({
      itemId: playlistTracks.id,
      position: playlistTracks.position,
      trackId: tracks.id,
      title: tracks.title,
      platform: tracks.platform,
      kind: tracks.kind,
      externalId: tracks.externalId,
      url: tracks.url,
      durationSec: tracks.durationSec,
      featured: tracks.featured,
      artistId: artists.id,
      artistName: artists.name,
      artistSlug: artists.slug,
      accent: artists.accent,
      coverUrl: artists.coverUrl,
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(asc(playlistTracks.position), asc(playlistTracks.id));

  return { playlist, items };
}
