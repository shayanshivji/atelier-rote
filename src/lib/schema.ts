import { pgTable, text, integer, doublePrecision, boolean, timestamp, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const onboardingProfiles = pgTable("onboarding_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  styles: text("styles").notNull(),
  colors: text("colors").notNull(),
  roomType: text("room_type").notNull(),
  wallWidth: integer("wall_width").notNull(),
  wallHeight: integer("wall_height").notNull(),
  lighting: text("lighting").notNull(),
  budgetTier: text("budget_tier").notNull(),
});

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
});

export const artworks = pgTable("artworks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artistId: text("artist_id").notNull().references(() => artists.id),
  imageUrls: text("image_urls").notNull(),
  styles: text("styles").notNull(),
  colors: text("colors").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  tier: text("tier").notNull(),
  description: text("description").notNull(),
  retailPrice: doublePrecision("retail_price").notNull(),
  available: boolean("available").notNull().default(true),
});

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default("residential"),
  monthlyPrice: doublePrecision("monthly_price").notNull(),
  setupFee: doublePrecision("setup_fee").notNull().default(0),
  piecesMin: integer("pieces_min").notNull(),
  piecesMax: integer("pieces_max"),
  piecesAllowed: integer("pieces_allowed").notNull(),
  swapsPerYear: integer("swaps_per_year").notNull(),
  rotationSchedule: text("rotation_schedule").notNull(),
  features: text("features").notNull(),
  insuranceLevel: text("insurance_level").notNull(),
  purchaseDiscount: doublePrecision("purchase_discount").notNull(),
  featured: boolean("featured").notNull().default(false),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  nextSwapDate: timestamp("next_swap_date").notNull(),
});

export const collectionItems = pgTable("collection_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  artworkId: text("artwork_id").notNull().references(() => artworks.id),
  status: text("status").notNull().default("ACTIVE"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
});

export const swapOrders = pgTable("swap_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("scheduled"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  deliveryType: text("delivery_type").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const boards = pgTable("boards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const favorites = pgTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  artworkId: text("artwork_id").notNull().references(() => artworks.id),
  boardId: text("board_id").references(() => boards.id, { onDelete: "set null" }),
}, (t) => [
  unique().on(t.userId, t.artworkId),
]);
