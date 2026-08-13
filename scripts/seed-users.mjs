/**
 * Crea las cuentas de demostración de ANTENA MUSICAL.
 *
 *   node scripts/seed-users.mjs
 *
 * - 1 administrador (ve el panel /admin y modera estaciones)
 * - 1 cuenta de artista por cada estación del seed
 *
 * Es idempotente: si la cuenta ya existe, actualiza su contraseña y su rol.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const PASSWORD = process.env.SEED_PASSWORD ?? "antena1234";

const ACCOUNTS = [
  { email: "admin@antenamusical.com", role: "admin", slug: null },
  { email: "neblina@antenamusical.com", role: "artist", slug: "neblina-norte" },
  { email: "rio@antenamusical.com", role: "artist", slug: "rio-solar" },
  { email: "voltaje@antenamusical.com", role: "artist", slug: "las-voltaje" },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const acc of ACCOUNTS) {
    let artistId = null;
    if (acc.slug) {
      const { rows } = await pool.query("SELECT id FROM artists WHERE slug = $1", [acc.slug]);
      artistId = rows[0]?.id ?? null;
      if (!artistId) {
        console.warn(`· sin estación "${acc.slug}", omito ${acc.email}`);
        continue;
      }
    }

    await pool.query(
      `INSERT INTO users (email, password_hash, role, artist_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role          = EXCLUDED.role,
             artist_id     = EXCLUDED.artist_id`,
      [acc.email, hash, acc.role, artistId]
    );
    console.log(`✓ ${acc.role.padEnd(6)} ${acc.email}${acc.slug ? ` → /${acc.slug}` : ""}`);
  }

  console.log(`\nContraseña para todas las cuentas: ${PASSWORD}`);
} catch (err) {
  console.error("Error creando cuentas:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
