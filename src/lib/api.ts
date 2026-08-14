import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { artists, users } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(data, { status, headers });
}

export async function findArtist(id: number) {
  const rows = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function authorizedArtist(id: number, token: string | undefined | null, cookieHeader?: string | null) {
  // 1. Cookie de sesión: cualquier usuario logueado dueño del artista
  if (cookieHeader) {
    const payload = getPayloadFromCookie(cookieHeader);
    if (payload?.artistId === id) {
      const rows = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
      return rows[0] ?? null;
    }
  }
  // 2. Fallback: editToken (legado / recuperación)
  if (token) {
    const rows = await db
      .select()
      .from(artists)
      .where(and(eq(artists.id, id), eq(artists.editToken, token)))
      .limit(1);
    return rows[0] ?? null;
  }
  return null;
}

export function sanitizeHex(value: unknown, fallback = "#FF4D00"): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  return fallback;
}
