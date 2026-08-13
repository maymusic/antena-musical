import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";

/** El rol se consulta en DB para que cambios de permisos sean inmediatos. */
export async function getRequestUser(req: Request) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return null;
  const rows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin(req: Request) {
  const user = await getRequestUser(req);
  return user?.role === "admin" ? user : null;
}
