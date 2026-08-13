import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashOpaqueToken } from "@/lib/crypto";
import { hashPassword, passwordStrength } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");
  const strength = passwordStrength(password);
  if (!strength.ok) return Response.json({ error: `Contraseña débil: ${strength.reason}.` }, { status: 400 });
  if (!/^[a-f0-9]{64}$/i.test(token)) return Response.json({ error: "El enlace de recuperación no es válido." }, { status: 400 });

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashOpaqueToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  const reset = rows[0];
  if (!reset) return Response.json({ error: "Este enlace ya caducó o fue utilizado. Solicita uno nuevo." }, { status: 400 });

  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, reset.id));
  });

  return Response.json({ ok: true });
}
