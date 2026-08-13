export const RESERVED_SLUGS = new Set([
  "crear",
  "editar",
  "api",
  "admin",
  "estaciones",
  "radio",
  "app",
  "login",
  "logout",
  "buscar",
  "presskit",
  "privacidad",
  "terminos",
  "recuperar-contrasena",
  "resetear-contrasena",
  "mi-dial",
]);

/* ============ GÉNEROS: catálogo completo ============ */
export const GENRE_GROUPS: { group: string; genres: string[] }[] = [
  {
    group: "Pop & Alternativa",
    genres: ["Pop", "Indie Pop", "Pop Rock", "Synthpop", "Dream Pop", "Indie", "Indie Rock", "Alternativa", "New Wave", "City Pop", "K-pop", "J-pop", "Hyperpop", "Vaporwave"],
  },
  {
    group: "Rock & Punk",
    genres: ["Rock", "Rock Clásico", "Hard Rock", "Rock Progresivo", "Grunge", "Garage Rock", "Punk", "Post-Punk", "Hardcore", "Ska Punk", "Rockabilly", "Psicodelia"],
  },
  {
    group: "Metal",
    genres: ["Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal", "Metalcore", "Doom", "Sludge", "Nu Metal"],
  },
  {
    group: "Electrónica & Dance",
    genres: ["Electrónica", "House", "Deep House", "Techno", "Trance", "Drum & Bass", "Dubstep", "EDM", "Ambient", "Chillout", "Downtempo", "Trip-hop", "Industrial", "Hardcore Electrónico"],
  },
  {
    group: "Hip-hop & Urbano",
    genres: ["Hip-hop", "Rap", "Trap", "Drill", "Freestyle", "Boom Bap", "Reggaetón", "Dembow", "Perreo", "Urbano", "Afrobeat", "Amapiano"],
  },
  {
    group: "R&B, Soul & Funk",
    genres: ["R&B", "Neo Soul", "Soul", "Funk", "Disco", "Gospel", "Motown"],
  },
  {
    group: "Jazz & Blues",
    genres: ["Jazz", "Smooth Jazz", "Jazz Fusion", "Bebop", "Blues", "Boogie", "Swing"],
  },
  {
    group: "Folk & Acústico",
    genres: ["Folk", "Indie Folk", "Singer-Songwriter", "Cantautor", "Acústico", "Country", "Americana", "Bluegrass"],
  },
  {
    group: "Latina & Tropical",
    genres: ["Música Latina", "Cumbia", "Cumbia Sonidera", "Salsa", "Merengue", "Bachata", "Bolero", "Vallenato", "Son", "Son Jarocho", "Banda", "Norteño", "Corridos", "Corridos Tumbados", "Ranchera", "Mariachi", "Regional Mexicano", "Sierreño", "Samba", "MPB", "Tango", "Flamenco", "Bossa Nova", "Tropicália", "Rumba"],
  },
  {
    group: "Reggae & Caribbean",
    genres: ["Reggae", "Roots Reggae", "Dub", "Dancehall", "Ska", "Rocksteady", "Calypso", "Soca"],
  },
  {
    group: "Clásica & Instrumental",
    genres: ["Clásica", "Contemporáneo", "Neoclásico", "Orquestal", "Soundtrack", "Post-rock", "Math Rock", "Shoegaze", "Lo-fi"],
  },
  {
    group: "Experimental & Otros",
    genres: ["Experimental", "Noise", "Avant-garde", "World Music", "Música Infantil", "Cristiana"],
  },
];

export const GENRES = GENRE_GROUPS.flatMap((g) => g.genres);

export const MAX_GENRES = 5;

export const ACCENTS = [
  { name: "Señal", hex: "#FF4D00" },
  { name: "Ámbar", hex: "#FFB000" },
  { name: "Lima", hex: "#C6F24E" },
  { name: "Verde ON AIR", hex: "#43E56C" },
  { name: "Turquesa", hex: "#35D0BA" },
  { name: "Cielo", hex: "#4DA6FF" },
  { name: "Rosa", hex: "#FF5C8A" },
  { name: "Hueso", hex: "#F2E9DA" },
];

export const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook", placeholder: "Tu página o URL de perfil" },
  { key: "instagram", label: "Instagram", placeholder: "@tucuenta o URL" },
  { key: "youtube", label: "YouTube", placeholder: "URL de tu canal" },
  { key: "tiktok", label: "TikTok", placeholder: "@tucuenta o URL" },
  { key: "x", label: "X / Twitter", placeholder: "@tucuenta o URL" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+52 55 1234 5678" },
  { key: "bandcamp", label: "Bandcamp", placeholder: "URL" },
  { key: "email", label: "Email de contacto", placeholder: "hola@tucorreo.com" },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function fakeFrequency(id: number): string {
  const mhz = 88 + ((id * 173) % 199) / 10;
  return mhz.toFixed(1);
}

/* ============ PLATAFORMAS DE MÚSICA ============ */
export type MusicPlatform =
  | "youtube"
  | "spotify"
  | "soundcloud"
  | "deezer"
  | "apple"
  | "bandcamp"
  | "tidal"
  | "amazon"
  | "audiomack"
  | "otro";

/** Plataformas que se pueden reproducir en la rotación (embed con autoplay). */
export const PLAYABLE_PLATFORMS: MusicPlatform[] = ["youtube", "spotify", "soundcloud", "deezer"];

export function isPlayable(platform: string): boolean {
  return PLAYABLE_PLATFORMS.includes(platform as MusicPlatform);
}

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  deezer: "Deezer",
  apple: "Apple Music",
  bandcamp: "Bandcamp",
  tidal: "Tidal",
  amazon: "Amazon Music",
  audiomack: "Audiomack",
  otro: "Enlace",
};

export type ParsedTrack =
  | { ok: true; platform: MusicPlatform; kind: string; externalId: string }
  | { ok: false; error: string };

export function parseMusicUrl(raw: string): ParsedTrack {
  const url = raw.trim();
  if (!url) return { ok: false, error: "Pega un enlace." };

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, error: "No reconozco ese enlace." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, error: "El enlace debe empezar con http:// o https://" };
  }

  // YouTube — los IDs de video tienen exactamente 11 caracteres
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { ok: true, platform: "youtube", kind: "video", externalId: yt[1] };
  if (/youtube\.com|youtu\.be/i.test(url)) {
    return { ok: false, error: "Ese enlace de YouTube no trae un ID de video válido. Copia la URL desde «Compartir»." };
  }

  // Spotify — los IDs tienen exactamente 22 caracteres base62
  const sp = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]{22})/i);
  if (sp) return { ok: true, platform: "spotify", kind: sp[1].toLowerCase(), externalId: sp[2] };
  if (/open\.spotify\.com/i.test(url)) {
    return { ok: false, error: "Ese enlace de Spotify no es válido. En Spotify: Compartir → Copiar enlace de la canción." };
  }

  // SoundCloud (guardamos la URL completa, el embed la necesita)
  const sc = url.match(/soundcloud\.com\/([^\/?#]+\/[^\/?#]+)/i);
  if (sc) return { ok: true, platform: "soundcloud", kind: "track", externalId: url.split(/[?#]/)[0] };

  // Deezer
  const dz = url.match(/deezer\.com\/(?:[a-z-]+\/)?(track|album|playlist|artist)\/(\d+)/i);
  if (dz) return { ok: true, platform: "deezer", kind: dz[1].toLowerCase(), externalId: dz[2] };

  // Apple Music → se muestra como enlace externo (su embed no permite autoplay fiable)
  const ap = url.match(/music\.apple\.com\/([a-z]{2})\/(album|playlist|song|artist)\/([^?#/]+)(?:\/(\d+))?/i);
  if (ap) {
    const id = ap[4] ?? ap[3];
    if (/^\d+$/.test(id)) {
      return { ok: true, platform: "apple", kind: ap[2].toLowerCase(), externalId: `${ap[1]}|${ap[2].toLowerCase()}|${id}` };
    }
  }

  // Bandcamp
  const bc = url.match(/bandcamp\.com\/(album|track)\/([^?#/]+)/i);
  if (bc) return { ok: true, platform: "bandcamp", kind: bc[1].toLowerCase(), externalId: url.split(/[?#]/)[0] };

  // Tidal
  if (/tidal\.com\//i.test(url)) return { ok: true, platform: "tidal", kind: "link", externalId: url };

  // Amazon Music
  if (/music\.amazon\./i.test(url)) return { ok: true, platform: "amazon", kind: "link", externalId: url };

  // Audiomack
  if (/audiomack\.com\//i.test(url)) return { ok: true, platform: "audiomack", kind: "link", externalId: url };

  // Cualquier otro enlace de música
  return { ok: true, platform: "otro", kind: "link", externalId: url };
}

export function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseDurationInput(input: string): number {
  const m = input.trim().match(/^(\d{1,3})[:.](\d{1,2})$/);
  if (m) return parseInt(m[1], 10) * 60 + Math.min(59, parseInt(m[2], 10));
  const n = parseInt(input, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 3600) : 210;
}

export function formatDate(iso: string | Date): { day: string; month: string; year: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: months[d.getMonth()],
    year: d.getFullYear().toString(),
  };
}
