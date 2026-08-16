import { sqliteTable, text, integer, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
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
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
});

export const studios = sqliteTable("studios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar").notNull(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const films = sqliteTable("films", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  year: integer("year").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  rating: text("rating").notNull(),
  category: text("category").notNull(),
  artistId: text("artist_id").references(() => artists.id, { onDelete: "cascade" }),
  studioId: text("studio_id").references(() => studios.id, { onDelete: "cascade" }),
  markedNewAt: text("marked_new_at"),
  poster: text("poster").notNull(),
  videoUrl: text("video_url").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  seriesTitle: text("series_title"),
  seasonNumber: integer("season_number"),
  episodeNumber: integer("episode_number"),
  episodeKind: text("episode_kind").notNull().default("episode"),
  teaserVideoUrl: text("teaser_video_url"),
  guestViewCount: integer("guest_view_count").notNull().default(0),
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
  artistId: text("artist_id").references(() => artists.id, { onDelete: "set null" }),
  studioId: text("studio_id").references(() => studios.id, { onDelete: "set null" }),
  contactEmail: text("contact_email").notNull(),
  poster: text("poster").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").notNull().default("pending"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  seriesTitle: text("series_title"),
  seasonNumber: integer("season_number"),
  episodeNumber: integer("episode_number"),
  episodeKind: text("episode_kind").notNull().default("episode"),
  teaserVideoUrl: text("teaser_video_url"),
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

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("favorites_user_film_unique").on(table.userId, table.filmId)]
);

export const watchHistory = sqliteTable(
  "watch_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    watchedAt: text("watched_at")
      .notNull()
      .default(sql`(current_timestamp)`),
    positionSeconds: integer("position_seconds").notNull().default(0),
  },
  (table) => [uniqueIndex("watch_history_user_film_unique").on(table.userId, table.filmId)]
);

export const studioMembers = sqliteTable(
  "studio_members",
  {
    id: text("id").primaryKey(),
    studioId: text("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("invited"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("studio_members_studio_user_unique").on(table.studioId, table.userId)]
);

export const filmRatings = sqliteTable(
  "film_ratings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filmId: text("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("film_ratings_user_film_unique").on(table.userId, table.filmId)]
);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filmId: text("film_id")
    .notNull()
    .references(() => films.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnySQLiteColumn => comments.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const commentReactions = sqliteTable(
  "comment_reactions",
  {
    id: text("id").primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("comment_reactions_comment_user_unique").on(table.commentId, table.userId)]
);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey(),
  revealEnabled: integer("reveal_enabled", { mode: "boolean" }).notNull().default(false),
  revealAt: text("reveal_at"),
  maintenanceEnabled: integer("maintenance_enabled", { mode: "boolean" }).notNull().default(false),
  patchNoteEnabled: integer("patch_note_enabled", { mode: "boolean" }).notNull().default(false),
  patchNoteTitle: text("patch_note_title"),
  patchNoteMessage: text("patch_note_message"),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  adminReply: text("admin_reply"),
  repliedAt: text("replied_at"),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
