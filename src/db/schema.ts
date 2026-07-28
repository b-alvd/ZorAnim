import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  nameChangedAt: text("name_changed_at"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar").notNull(),
});

export const films = sqliteTable("films", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  year: integer("year").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  rating: text("rating").notNull(),
  category: text("category").notNull(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  markedNewAt: text("marked_new_at"),
  poster: text("poster").notNull(),
  videoUrl: text("video_url").notNull(),
});

export const filmSubmissions = sqliteTable("film_submissions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  year: integer("year").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  rating: text("rating").notNull(),
  category: text("category").notNull(),
  artistName: text("artist_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  poster: text("poster").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").notNull().default("pending"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const artistSubmissions = sqliteTable("artist_submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar"),
  portfolioUrl: text("portfolio_url"),
  contactEmail: text("contact_email").notNull(),
  status: text("status").notNull().default("pending"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
