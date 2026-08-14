import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const SALT_ROUNDS = 10;
export const SESSION_COOKIE = "antena_session";

const JWT_SECRET = process.env.JWT_SECRET || "antena-dev-secret-change-me-in-production-2026";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; email: string; artistId?: number }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; email: string; artistId?: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; artistId?: number };
  } catch {
    return null;
  }
}

const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";

export function sessionCookie(token: string, maxAgeDays = 30): string {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
}

export function getEmailFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const payload = verifyToken(match[1]);
  return payload?.email ?? null;
}

export function getPayloadFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return verifyToken(match[1]);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function passwordStrength(password: string): { ok: boolean; reason: string } {
  if (password.length < 8) return { ok: false, reason: "mínimo 8 caracteres" };
  if (password.length > 128) return { ok: false, reason: "máximo 128 caracteres" };
  return { ok: true, reason: "" };
}
