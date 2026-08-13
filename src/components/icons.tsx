import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  ...props,
});

export const IconAntenna = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 13v9M12 13l-5 9M12 13l5 9" />
    <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
    <path d="M7.8 7.2a6 6 0 0 1 8.4 0M5 4.4a10 10 0 0 1 14 0" />
  </svg>
);

export const IconPlay = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7 4.5v15l13-7.5L7 4.5z" />
  </svg>
);

export const IconPause = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="4" width="4.5" height="16" rx="1" />
    <rect x="13.5" y="4" width="4.5" height="16" rx="1" />
  </svg>
);

export const IconNext = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5 4.5v15l10-7.5L5 4.5z" />
    <rect x="17" y="4.5" width="3" height="15" rx="1" />
  </svg>
);

export const IconPrev = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 4.5v15l-10-7.5 10-7.5z" />
    <rect x="4" y="4.5" width="3" height="15" rx="1" />
  </svg>
);

export const IconShuffle = (props: P) => (
  <svg {...base(props)}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

export const IconVolume = (props: P) => (
  <svg {...base(props)}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.5 9.5 0 0 1 0 13" />
  </svg>
);

export const IconYoutube = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 0 0-2-2C18.6 4 12 4 12 4s-6.6 0-8.5.4a2.9 2.9 0 0 0-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 0 0 2 2c1.9.4 8.5.4 8.5.4s6.6 0 8.5-.4a2.9 2.9 0 0 0 2-2c.5-1.8.5-5.6.5-5.6zM9.8 15.5v-7l6 3.5-6 3.5z" />
  </svg>
);

export const IconSpotify = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5 15.9a.7.7 0 0 1-1 .2c-2.7-1.6-6-2-10-1.1a.7.7 0 0 1-.3-1.4c4.3-1 8-.5 11 1.3.3.2.4.7.3 1zm1.4-3.1a.9.9 0 0 1-1.2.3c-3-1.9-7.7-2.4-11.3-1.3a.9.9 0 0 1-.5-1.7c4.1-1.3 9.3-.7 12.7 1.5.4.2.5.8.3 1.2zm.1-3.2C15 8.5 9.1 8.3 5.7 9.3a1 1 0 1 1-.6-2c4-1.2 10.5-1 14.5 1.4a1 1 0 0 1-1 1.9z" />
  </svg>
);

export const IconInstagram = (props: P) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTiktok = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.6 2h-3.2v13.6a3 3 0 1 1-3-3c.3 0 .7 0 1 .1V9.4a6.3 6.3 0 0 0-1-.1 6.2 6.2 0 1 0 6.2 6.2V8.7a8 8 0 0 0 4.6 1.4V6.9a4.9 4.9 0 0 1-4.6-4.9z" />
  </svg>
);

export const IconX = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
  </svg>
);

export const IconGlobe = (props: P) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

export const IconMail = (props: P) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const IconBandcamp = (props: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M1 6h13.5L22 18H8.5L1 6z" />
  </svg>
);

export const IconUpload = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 16V4M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

export const IconTrash = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </svg>
);

export const IconArrowRight = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 12h16M13 5l7 7-7 7" />
  </svg>
);

export const IconMusic = (props: P) => (
  <svg {...base(props)}>
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    <path d="M9 18V5l12-2v13" />
  </svg>
);

export const IconCalendar = (props: P) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const IconMapPin = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconClose = (props: P) => (
  <svg {...base(props)}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export const IconEdit = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export const IconEye = (props: P) => (
  <svg {...base(props)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconVerified = (props: P) => (
  <svg viewBox="0 0 20 20" {...props} role="img" aria-label="Perfil verificado">
    <circle cx="10" cy="10" r="9" fill="#4DA6FF" />
    <path d="M6.2 10.4l2.5 2.5 5.1-5.4" stroke="#0b1220" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconPlus = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const IconImage = (props: P) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M3 18l6-6 4 4 3-3 5 5" />
  </svg>
);

export const IconLink = (props: P) => (
  <svg {...base(props)}>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
  </svg>
);

export const IconRadio = (props: P) => (
  <svg {...base(props)}>
    <rect x="2" y="8" width="20" height="12" rx="2" />
    <path d="M7 8l11-5" />
    <circle cx="8" cy="14" r="2.5" />
    <path d="M14 12h5M14 16h5" />
  </svg>
);

export const IconWave = (props: P) => (
  <svg {...base(props)}>
    <path d="M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M22 12h0" />
  </svg>
);

export function VuMeter({ playing, bars = 5, className = "" }: { playing: boolean; bars?: number; className?: string }) {
  return (
    <span className={`flex items-end gap-[3px] h-4 ${playing ? "" : "vu-paused"} ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="vu-bar w-[3px] h-full st-bg"
          style={{ animationDelay: `${(i * 0.13) % 0.9}s`, animationDuration: `${0.7 + (i % 3) * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function socialIcon(key: string, className = "w-4 h-4") {
  switch (key) {
    case "instagram": return <IconInstagram className={className} />;
    case "youtube": return <IconYoutube className={className} />;
    case "tiktok": return <IconTiktok className={className} />;
    case "x": return <IconX className={className} />;
    case "bandcamp": return <IconBandcamp className={className} />;
    case "email": return <IconMail className={className} />;
    default: return <IconGlobe className={className} />;
  }
}

export function socialHref(key: string, value: string): string {
  const v = value.trim();
  if (v.startsWith("http")) return v;
  if (key === "email") return `mailto:${v}`;
  if (key === "instagram") return `https://instagram.com/${v.replace(/^@/, "")}`;
  if (key === "tiktok") return `https://tiktok.com/@${v.replace(/^@/, "")}`;
  if (key === "x") return `https://x.com/${v.replace(/^@/, "")}`;
  if (key === "youtube") return v.startsWith("@") ? `https://youtube.com/${v}` : `https://youtube.com/${v}`;
  return v;
}

/* ============ badges de plataformas de música ============ */
export const PLATFORM_COLORS: Record<string, string> = {
  soundcloud: "#FF5500",
  deezer: "#FF2F56",
  apple: "#E8E8E8",
  bandcamp: "#1DA0C3",
  tidal: "#E0E0E0",
  amazon: "#00A8E1",
  audiomack: "#FFA200",
  otro: "#B8AB97",
};

export const PLATFORM_CODES: Record<string, string> = {
  soundcloud: "SC",
  deezer: "DZ",
  apple: "AM",
  bandcamp: "BC",
  tidal: "TL",
  amazon: "AZ",
  audiomack: "AK",
  otro: "LINK",
};

export function PlatformChip({ platform, className = "" }: { platform: string; className?: string }) {
  if (platform === "youtube") return <IconYoutube className={className || "w-4 h-4 text-signal shrink-0"} />;
  if (platform === "spotify") return <IconSpotify className={className || "w-4 h-4 text-onair shrink-0"} />;
  if (platform === "bandcamp") return <IconBandcamp className={className || "w-4 h-4 shrink-0"} style={{ color: PLATFORM_COLORS.bandcamp }} />;
  const color = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.otro;
  const code = PLATFORM_CODES[platform] ?? platform.slice(0, 3).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center border font-tech font-bold tracking-wider ${className || "w-8 h-5 text-[8px]"}`}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      {code}
    </span>
  );
}

export function platformLabel(platform: string): string {
  switch (platform) {
    case "youtube": return "YouTube";
    case "spotify": return "Spotify";
    case "soundcloud": return "SoundCloud";
    case "deezer": return "Deezer";
    case "apple": return "Apple Music";
    case "bandcamp": return "Bandcamp";
    case "tidal": return "Tidal";
    case "amazon": return "Amazon Music";
    case "audiomack": return "Audiomack";
    default: return "Enlace";
  }
}
