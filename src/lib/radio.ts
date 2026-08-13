import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { isPlayable, PLAYABLE_PLATFORMS } from "@/lib/parse";

/**
 * ANTENA MUSICAL CENTRAL — parrilla de emisión global.
 *
 * La emisión es determinista: se calcula a partir del reloj (no se guarda estado).
 * Todos los oyentes que entran en el mismo instante escuchan exactamente la misma
 * canción en el mismo segundo, igual que una radio real.
 */

/** Inicio del ciclo de emisión de la red (fijo, para que el cálculo sea estable). */
export const BROADCAST_EPOCH = Date.UTC(2026, 0, 1, 0, 0, 0);

/** Colchón entre pistas: el "aire" del locutor. */
export const GAP_SEC = 2;

export type RadioSlot = {
  trackId: number;
  title: string;
  platform: "youtube" | "spotify" | "soundcloud" | "deezer";
  kind: string;
  externalId: string;
  url: string;
  durationSec: number;
  artistId: number;
  artistName: string;
  artistSlug: string;
  accent: string;
  coverUrl: string;
  /** 1 si el artista la marcó como destacada. */
  featured: number;
  /** Segundo del ciclo en el que arranca esta pista. */
  startsAt: number;
};

export type NowPlaying = {
  onAir: boolean;
  serverNow: number;
  /** Segundos ya transcurridos de la pista actual. */
  offsetSec: number;
  /** Milisegundos que faltan para que termine la pista actual. */
  msToNext: number;
  cycleSec: number;
  slotIndex: number;
  totalSlots: number;
  current: RadioSlot | null;
  upcoming: RadioSlot[];
  listeners: number;
};

/** Baraja determinista: reparte las pistas alternando artistas (round-robin). */
function interleaveByArtist(rows: RadioSlot[]): RadioSlot[] {
  const byArtist = new Map<number, RadioSlot[]>();
  for (const row of rows) {
    const list = byArtist.get(row.artistId);
    if (list) list.push(row);
    else byArtist.set(row.artistId, [row]);
  }
  const buckets = [...byArtist.values()];
  const out: RadioSlot[] = [];
  let round = 0;
  while (out.length < rows.length) {
    let pushedThisRound = false;
    for (const bucket of buckets) {
      const item = bucket[round];
      if (item) {
        out.push(item);
        pushedThisRound = true;
      }
    }
    if (!pushedThisRound) break;
    round += 1;
  }
  return out;
}

export async function getSchedule(): Promise<RadioSlot[]> {
  const rows = await db
    .select({
      trackId: tracks.id,
      title: tracks.title,
      platform: tracks.platform,
      kind: tracks.kind,
      externalId: tracks.externalId,
      url: tracks.url,
      durationSec: tracks.durationSec,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
      accent: artists.accent,
      coverUrl: artists.coverUrl,
      featured: tracks.featured,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    // La parrilla global solo usa YouTube: es la única plataforma cuyo reproductor
    // arranca solo y permite entrar a mitad de canción (emisión real sin cortes).
    .where(and(eq(tracks.platform, "youtube"), eq(artists.moderationStatus, "active")))
    .orderBy(asc(tracks.artistId), asc(tracks.position), asc(tracks.id));

  const slots = interleaveByArtist(
    rows.map((r) => ({
      ...r,
      platform: (isPlayable(r.platform) ? r.platform : "youtube") as "youtube" | "spotify" | "soundcloud" | "deezer",
      durationSec: Math.max(30, Math.min(r.durationSec || 210, 1800)),
      startsAt: 0,
    }))
  );

  let cursor = 0;
  for (const slot of slots) {
    slot.startsAt = cursor;
    cursor += slot.durationSec + GAP_SEC;
  }
  return slots;
}

export function resolveNow(schedule: RadioSlot[], nowMs = Date.now()): NowPlaying {
  const cycleSec = schedule.reduce((sum, s) => sum + s.durationSec + GAP_SEC, 0);

  if (schedule.length === 0 || cycleSec === 0) {
    return {
      onAir: false,
      serverNow: nowMs,
      offsetSec: 0,
      msToNext: 15000,
      cycleSec: 0,
      slotIndex: -1,
      totalSlots: 0,
      current: null,
      upcoming: [],
      listeners: 0,
    };
  }

  const elapsedSec = Math.floor(((nowMs - BROADCAST_EPOCH) / 1000) % cycleSec + cycleSec) % cycleSec;

  let slotIndex = 0;
  for (let i = 0; i < schedule.length; i += 1) {
    const slot = schedule[i];
    if (elapsedSec < slot.startsAt + slot.durationSec + GAP_SEC) {
      slotIndex = i;
      break;
    }
    slotIndex = i;
  }

  const current = schedule[slotIndex];
  const rawOffset = elapsedSec - current.startsAt;
  const offsetSec = Math.max(0, Math.min(rawOffset, current.durationSec));
  const msToNext = Math.max(500, (current.durationSec + GAP_SEC - rawOffset) * 1000);

  const upcoming: RadioSlot[] = [];
  for (let i = 1; i <= Math.min(5, schedule.length - 1); i += 1) {
    upcoming.push(schedule[(slotIndex + i) % schedule.length]);
  }

  // Oyentes "en vivo": determinista por minuto para que no baile en cada refresco.
  const minuteSeed = Math.floor(nowMs / 60000);
  const listeners = 40 + ((minuteSeed * 7919) % 260) + schedule.length * 3;

  return {
    onAir: true,
    serverNow: nowMs,
    offsetSec,
    msToNext,
    cycleSec,
    slotIndex,
    totalSlots: schedule.length,
    current,
    upcoming,
    listeners,
  };
}

export async function getNowPlaying(): Promise<NowPlaying> {
  const schedule = await getSchedule();
  return resolveNow(schedule);
}
