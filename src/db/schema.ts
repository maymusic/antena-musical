import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  artistId: integer("artist_id").unique(),
  role: text("role").notNull().default("artist"), // artist | admin
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  genres: text("genres")
    .array()
    .notNull()
    .default([] as string[]),
  city: text("city").notNull().default(""),
  bio: text("bio").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  accent: text("accent").notNull().default("#FF4D00"),
  socials: jsonb("socials").$type<Record<string, string>>().notNull().default({}),
  phone: text("phone").notNull().default(""),
  booking: text("booking").notNull().default(""),
  credits: jsonb("credits").$type<{ role: string; name: string }[]>().notNull().default([]),
  moderationStatus: text("moderation_status").notNull().default("active"), // active | suspended | pending
  moderationNote: text("moderation_note").notNull().default(""),
  presskitUrl: text("presskit_url").notNull().default(""),
  presskitLabel: text("presskit_label").notNull().default(""),
  verificationStatus: text("verification_status").notNull().default("none"), // none | requested | uploaded | approved | rejected
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationNote: text("verification_note").notNull().default(""),
  editToken: text("edit_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Favorite = typeof favorites.$inferSelect;

export const verificationDocs = pgTable("verification_docs", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  label: text("label").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // 'youtube' | 'spotify'
  kind: text("kind").notNull().default("video"), // youtube: video | spotify: track/album/playlist
  externalId: text("external_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  durationSec: integer("duration_sec").notNull().default(210),
  position: integer("position").notNull().default(0),
  lyrics: text("lyrics").notNull().default(""),
  plays: integer("plays").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  showDate: timestamp("show_date", { withTimezone: true }).notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  nick: text("nick").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type ImageRow = typeof images.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type VerificationDoc = typeof verificationDocs.$inferSelect;
