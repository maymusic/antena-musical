import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getPayloadFromCookie,
  hashPassword,
  passwordStrength,
  sessionCookie,
  signToken,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST = cambiar contraseña estando dentro (pide la actual por seguridad). */
export async function POST(req: Request) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return Response.json({ error: "Inicia sesión para cambiar tu contraseña." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  const strength = passwordStrength(newPassword);
  if (!strength.ok) return Response.json({ error: `Contraseña nueva débil: ${strength.reason}.` }, { status: 400 });
  if (currentPassword === newPassword) {
    return Response.json({ error: "La contraseña nueva debe ser distinta a la actual." }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  const user = rows[0];
  if (!user) return Response.json({ error: "Cuenta no encontrada." }, { status: 404 });

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return Response.json({ error: "La contraseña actual no es correcta." }, { status: 403 });

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  // Renueva la sesión para que el usuario no sea expulsado tras el cambio.
  const token = signToken({
    userId: user.id,
    email: user.email,
    artistId: user.artistId ?? undefined,
  });

  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token) } });
}
