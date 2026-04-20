import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "prisma", "dev.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS onboarding_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    styles TEXT NOT NULL,
    colors TEXT NOT NULL,
    room_type TEXT NOT NULL,
    wall_width INTEGER NOT NULL,
    wall_height INTEGER NOT NULL,
    lighting TEXT NOT NULL,
    budget_tier TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id TEXT NOT NULL REFERENCES artists(id),
    image_urls TEXT NOT NULL,
    styles TEXT NOT NULL,
    colors TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    tier TEXT NOT NULL,
    description TEXT NOT NULL,
    retail_price REAL NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
  );

  DROP TABLE IF EXISTS plans;
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'residential',
    monthly_price REAL NOT NULL,
    setup_fee REAL NOT NULL DEFAULT 0,
    pieces_min INTEGER NOT NULL,
    pieces_max INTEGER,
    pieces_allowed INTEGER NOT NULL,
    swaps_per_year INTEGER NOT NULL,
    rotation_schedule TEXT NOT NULL,
    features TEXT NOT NULL,
    insurance_level TEXT NOT NULL,
    purchase_discount REAL NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    start_date INTEGER NOT NULL,
    next_swap_date INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collection_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id TEXT NOT NULL REFERENCES artworks(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    start_date INTEGER NOT NULL,
    end_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS swap_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'scheduled',
    scheduled_at INTEGER NOT NULL,
    delivery_type TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id TEXT NOT NULL REFERENCES artworks(id),
    board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
    UNIQUE(user_id, artwork_id)
  );

  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );
`);

console.log("Database tables created successfully at", dbPath);
db.close();
