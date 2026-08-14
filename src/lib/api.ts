import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { artists, users } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(data, { status, headers });
}

/**
 * Envuelve un handler de API para que NUNCA devuelva una respuesta vacía.
 *
 * Sin esto, si la consulta falla (por ejemplo porque aún no se aplicó la
 * migración y la tabla no existe), la ruta revienta, el servidor corta la
 * conexión y el navegador falla con:
 *   "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 */
export async function safeRoute<T>(fn: () => Promise<T>): Promise<T | Response> {
  try {
    return await fn();
  } catch (error) {
    // Drizzle envuelve el error de PostgreSQL, así que el código real
    // puede venir en `cause` en lugar de en el error de primer nivel.
    const err = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    const pgCode = err?.code ?? err?.cause?.code;
    const detail = `${err?.message ?? ""} ${err?.cause?.message ?? ""}`;

    // 42P01 = undefined_table · 42703 = undefined_column
    const missingSchema =
      pgCode === "42P01" ||
      pgCode === "42703" ||
      /relation .* does not exist|column .* does not exist/i.test(detail);

    if (missingSchema) {
      return json(
        {
          error:
            "Esta función aún no está activa en la base de datos. Falta aplicar la migración: ejecuta «npx drizzle-kit push».",
          code: "MISSING_TABLE",
        },
        503
      );
    }

    console.error("[api] error no controlado:", error);
    return json({ error: "Error inesperado en el servidor. Inténtalo de nuevo." }, 500);
  }
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
