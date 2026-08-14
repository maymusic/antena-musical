-- ============================================================
-- ANTENA MUSICAL · playlists públicas + canciones destacadas
-- Pega este SQL completo en Neon Console → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo varias veces sin perder datos.
-- ============================================================

-- 1) Etiqueta neón «Destacada» en las pistas
ALTER TABLE "public"."tracks"
  ADD COLUMN IF NOT EXISTS "featured" integer NOT NULL DEFAULT 0;

-- 2) Playlists creadas por usuarios
CREATE TABLE IF NOT EXISTS "public"."playlists" (
  "id"          serial PRIMARY KEY,
  "user_id"     integer NOT NULL,
  "name"        text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "is_public"   integer NOT NULL DEFAULT 0,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);

-- Compatible con playlists creadas antes de la opción pública.
-- Todas comienzan privadas por seguridad hasta que su dueño pulse «Publicar».
ALTER TABLE "public"."playlists"
  ADD COLUMN IF NOT EXISTS "is_public" integer NOT NULL DEFAULT 0;

-- 3) Canciones dentro de cada playlist
CREATE TABLE IF NOT EXISTS "public"."playlist_tracks" (
  "id"          serial PRIMARY KEY,
  "playlist_id" integer NOT NULL,
  "track_id"    integer NOT NULL,
  "position"    integer NOT NULL DEFAULT 0,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);

-- 4) Relaciones seguras con borrado en cascada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlists_user_id_users_id_fk') THEN
    ALTER TABLE "public"."playlists"
      ADD CONSTRAINT playlists_user_id_users_id_fk
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlist_tracks_playlist_id_playlists_id_fk') THEN
    ALTER TABLE "public"."playlist_tracks"
      ADD CONSTRAINT playlist_tracks_playlist_id_playlists_id_fk
      FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlist_tracks_track_id_tracks_id_fk') THEN
    ALTER TABLE "public"."playlist_tracks"
      ADD CONSTRAINT playlist_tracks_track_id_tracks_id_fk
      FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Comprobación final
SELECT
  to_regclass('public.playlists')       AS playlists,
  to_regclass('public.playlist_tracks') AS playlist_tracks,
  (SELECT column_default
     FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'featured') AS featured_default,
  (SELECT column_default
     FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'playlists' AND column_name = 'is_public') AS public_default;
