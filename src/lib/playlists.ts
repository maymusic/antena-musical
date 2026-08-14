import { and, asc, desc, eq, sql } from "drizzle-orm";
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

/**
 * Directorio público: todas las playlists que sus dueños decidieron publicar,
 * con su número de canciones y una carátula de muestra.
 */
export async function listPublicPlaylists() {
  const rows = await db
    .select({
      id: playlists.id,
      name: playlists.name,
      description: playlists.description,
      createdAt: playlists.createdAt,
      trackCount: sql<number>`count(${playlistTracks.id})`.as("trackCount"),
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.isPublic, 1))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.id));

  // Carátula + acento de la primera canción de cada playlist
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [first] = await db
        .select({
          title: tracks.title,
          platform: tracks.platform,
          externalId: tracks.externalId,
          artistName: artists.name,
          artistSlug: artists.slug,
          accent: artists.accent,
          coverUrl: artists.coverUrl,
        })
        .from(playlistTracks)
        .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
        .innerJoin(artists, eq(tracks.artistId, artists.id))
        .where(eq(playlistTracks.playlistId, row.id))
        .orderBy(asc(playlistTracks.position), asc(playlistTracks.id))
        .limit(1);

      const cover =
        first?.platform === "youtube" && first.externalId
          ? `https://i.ytimg.com/vi/${first.externalId}/hqdefault.jpg`
          : first?.coverUrl || "";

      return {
        ...row,
        trackCount: Number(row.trackCount ?? 0),
        accent: first?.accent ?? "#FF4D00",
        cover,
        firstTitle: first?.title ?? null,
        firstArtist: first?.artistName ?? null,
        firstArtistSlug: first?.artistSlug ?? null,
      };
    })
  );

  return enriched;
}

/**
 * Variante segura para visitantes: solo devuelve una playlist que su dueño
 * decidió publicar. Las privadas ni siquiera revelan su nombre o canciones.
 */
export async function getPublicPlaylistDetail(playlistId: number) {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.isPublic, 1)))
    .limit(1);

  if (!playlist) return null;

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
