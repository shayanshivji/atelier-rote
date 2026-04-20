import { createClient } from "@libsql/client";
import { hashSync } from "bcryptjs";
import crypto from "crypto";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars first.");
  process.exit(1);
}

const db = createClient({ url, authToken });

function id() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

console.log("Creating tables...");

await db.executeMultiple(`
  DROP TABLE IF EXISTS favorites;
  DROP TABLE IF EXISTS boards;
  DROP TABLE IF EXISTS swap_orders;
  DROP TABLE IF EXISTS collection_items;
  DROP TABLE IF EXISTS subscriptions;
  DROP TABLE IF EXISTS onboarding_profiles;
  DROP TABLE IF EXISTS artworks;
  DROP TABLE IF EXISTS artists;
  DROP TABLE IF EXISTS plans;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE onboarding_profiles (
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

  CREATE TABLE artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT NOT NULL
  );

  CREATE TABLE artworks (
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

  CREATE TABLE plans (
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

  CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    start_date INTEGER NOT NULL,
    next_swap_date INTEGER NOT NULL
  );

  CREATE TABLE collection_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id TEXT NOT NULL REFERENCES artworks(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    start_date INTEGER NOT NULL,
    end_date INTEGER
  );

  CREATE TABLE swap_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'scheduled',
    scheduled_at INTEGER NOT NULL,
    delivery_type TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );

  CREATE TABLE favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id TEXT NOT NULL REFERENCES artworks(id),
    board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
    UNIQUE(user_id, artwork_id)
  );
`);

console.log("Tables created. Seeding data...");

// ── Plans ──
const planRows = [
  [id(), "Essential", "residential", 149, 199, 2, 3, 3, 2, "Every 6 months", JSON.stringify(["2\u20133 pieces","Rotation every 6 months","One style consultation","Standard delivery & install","Access to curated capsule collection"]), "Standard", 0, 0],
  [id(), "Signature", "residential", 299, 299, 4, 6, 6, 2, "Every 6 months", JSON.stringify(["4\u20136 pieces","Rotation every 6 months","Curated per room","Optional frame upgrades","Buyout credit built in"]), "Enhanced", 0.10, 1],
  [id(), "Concierge", "residential", 599, 500, 7, 12, 12, 4, "Flexible", JSON.stringify(["7\u201312 pieces","Priority curation","Flexible rotation schedule","Room-by-room styling","Direct access to advisor"]), "Premium", 0.15, 0],
  [id(), "Brand Basic", "commercial", 499, 750, 5, 8, 8, 4, "Quarterly or semiannual", JSON.stringify(["5\u20138 pieces","Quarterly or semiannual refresh","Curated to brand palette","Install & removal included"]), "Commercial", 0, 0],
  [id(), "Brand Signature", "commercial", 999, 1500, 10, 18, 18, 4, "Quarterly", JSON.stringify(["10\u201318 pieces","Curated to brand identity","Creative direction included","Quarterly rotation","Priority sourcing"]), "Commercial Plus", 0.10, 1],
  [id(), "Full Atmosphere", "commercial", 0, 0, 20, null, 100, 12, "Ongoing", JSON.stringify(["20+ pieces","Full concept & multi-zone program","Ongoing rotation schedule","Dedicated account management","Custom pricing"]), "Enterprise", 0.15, 0],
];

for (const r of planRows) {
  await db.execute({
    sql: `INSERT INTO plans (id, name, category, monthly_price, setup_fee, pieces_min, pieces_max, pieces_allowed, swaps_per_year, rotation_schedule, features, insurance_level, purchase_discount, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: r,
  });
}

// ── Demo User ──
const userId = id();
await db.execute({
  sql: "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
  args: [userId, "Demo User", "demo@atelier-rote.com", hashSync("password123", 10), Date.now()],
});

// ── Artists ──
const artistData = [
  { name: "Elara Voss", bio: "Berlin-based abstract expressionist exploring emotion through color and form." },
  { name: "Marcus Chen", bio: "Photographer and digital artist from San Francisco. Known for minimalist urban landscapes." },
  { name: "Sofia Andersson", bio: "Swedish painter inspired by Nordic light and nature." },
  { name: "James Okafor", bio: "Nigerian-American mixed-media artist exploring identity, heritage, and the African diaspora." },
  { name: "Yuki Tanaka", bio: "Tokyo-born artist working with ink and digital media." },
  { name: "Camille Dupont", bio: "French oil painter known for dreamlike landscapes and atmospheric studies." },
  { name: "Leo Petrov", bio: "Russian contemporary artist creating striking geometric compositions." },
  { name: "Nia Williams", bio: "London-based photographer capturing intimate moments of everyday beauty." },
];

const artistIds = {};
for (const a of artistData) {
  const aid = id();
  artistIds[a.name] = aid;
  await db.execute({ sql: "INSERT INTO artists (id, name, bio) VALUES (?, ?, ?)", args: [aid, a.name, a.bio] });
}

// ── Artworks ──
const artworkSeed = [
  { artist: "Elara Voss", title: "Vermillion Dreams", styles: ["Abstract","Bold","Colorful"], colors: ["Red","Orange","Gold"], w: 36, h: 48, tier: "Premium", price: 2400, desc: "A sweeping abstract canvas pulsing with warm vermillion tones." },
  { artist: "Elara Voss", title: "Stillness in Blue", styles: ["Abstract","Calm","Minimal"], colors: ["Blue","White","Teal"], w: 40, h: 30, tier: "Collector", price: 3800, desc: "Layered blues and whites create a meditative surface." },
  { artist: "Elara Voss", title: "Fragment No. 7", styles: ["Abstract","Modern"], colors: ["Black","White","Gold"], w: 24, h: 24, tier: "Basic", price: 950, desc: "A study in contrast and negative space." },
  { artist: "Elara Voss", title: "Ember Field", styles: ["Abstract","Bold"], colors: ["Red","Black","Orange"], w: 48, h: 36, tier: "Premium", price: 2800, desc: "Dynamic gestural strokes evoke elemental force." },
  { artist: "Elara Voss", title: "Soft Horizon", styles: ["Abstract","Calm","Nature"], colors: ["Pink","Neutral","White"], w: 60, h: 40, tier: "Collector", price: 4200, desc: "A distant horizon dissolving into atmospheric haze." },
  { artist: "Elara Voss", title: "Resonance I", styles: ["Abstract","Minimal"], colors: ["Teal","White"], w: 30, h: 40, tier: "Basic", price: 1100, desc: "Concentric forms in cool teal." },
  { artist: "Elara Voss", title: "Golden Hour Study", styles: ["Abstract","Colorful"], colors: ["Gold","Orange","Yellow"], w: 20, h: 20, tier: "Basic", price: 780, desc: "A luminous study capturing late afternoon light." },
  { artist: "Marcus Chen", title: "Grid City", styles: ["Photography","Modern","Minimal"], colors: ["Black","White","Neutral"], w: 30, h: 40, tier: "Basic", price: 850, desc: "An aerial photograph as abstract geometric pattern." },
  { artist: "Marcus Chen", title: "Reflected Symmetry", styles: ["Photography","Modern"], colors: ["Blue","White","Black"], w: 36, h: 24, tier: "Premium", price: 1800, desc: "A perfectly mirrored reflection in glass and water." },
  { artist: "Marcus Chen", title: "Concrete Poetry", styles: ["Photography","Minimal","Modern"], colors: ["Neutral","Black","White"], w: 24, h: 36, tier: "Basic", price: 920, desc: "Brutalist architecture rendered with tenderness." },
  { artist: "Marcus Chen", title: "Neon Nocturne", styles: ["Photography","Bold","Colorful"], colors: ["Pink","Purple","Blue"], w: 40, h: 30, tier: "Premium", price: 2200, desc: "Rain-slicked streets glow with reflected neon." },
  { artist: "Marcus Chen", title: "Morning Fog, Pier 7", styles: ["Photography","Calm","Nature"], colors: ["White","Neutral","Blue"], w: 48, h: 32, tier: "Collector", price: 3200, desc: "The waterfront disappears into luminous morning fog." },
  { artist: "Marcus Chen", title: "Shadow Lines", styles: ["Photography","Black & White","Minimal"], colors: ["Black","White"], w: 20, h: 30, tier: "Basic", price: 680, desc: "Hard shadows create a striking rhythm across a white wall." },
  { artist: "Marcus Chen", title: "Rust & Glass", styles: ["Photography","Modern"], colors: ["Orange","Teal","Neutral"], w: 30, h: 30, tier: "Premium", price: 1650, desc: "Industrial decay contrasts with sleek modern architecture." },
  { artist: "Marcus Chen", title: "Vanishing Point", styles: ["Photography","Minimal","Modern"], colors: ["White","Neutral"], w: 36, h: 48, tier: "Collector", price: 3500, desc: "A corridor stretches toward infinity." },
  { artist: "Sofia Andersson", title: "Midnight Sun", styles: ["Nature","Calm","Classic"], colors: ["Blue","Gold","Purple"], w: 48, h: 36, tier: "Collector", price: 4500, desc: "Ethereal light of a Scandinavian summer night." },
  { artist: "Sofia Andersson", title: "Birch Forest", styles: ["Nature","Calm"], colors: ["White","Green","Neutral"], w: 36, h: 48, tier: "Premium", price: 2600, desc: "Slender birch trunks rise through dappled light." },
  { artist: "Sofia Andersson", title: "Winter Light No. 3", styles: ["Minimal","Calm","Nature"], colors: ["White","Blue","Neutral"], w: 40, h: 30, tier: "Premium", price: 2100, desc: "Pale winter light suffuses a snowy landscape." },
  { artist: "Sofia Andersson", title: "Spring Thaw", styles: ["Nature","Colorful"], colors: ["Green","Blue","Yellow"], w: 30, h: 40, tier: "Basic", price: 1200, desc: "Fresh greens and clear blues celebrate the return of color." },
  { artist: "Sofia Andersson", title: "Archipelago", styles: ["Nature","Abstract","Calm"], colors: ["Blue","Teal","White"], w: 60, h: 40, tier: "Collector", price: 5200, desc: "Islands abstracted into essential forms of land and water." },
  { artist: "Sofia Andersson", title: "Northern Moss", styles: ["Nature","Minimal"], colors: ["Green","Neutral","White"], w: 24, h: 24, tier: "Basic", price: 890, desc: "Moss and lichen rendered with exquisite textural detail." },
  { artist: "Sofia Andersson", title: "Fjord at Dusk", styles: ["Nature","Classic","Calm"], colors: ["Purple","Blue","Gold"], w: 40, h: 30, tier: "Premium", price: 2400, desc: "Twilight colors reflect in still fjord waters." },
  { artist: "James Okafor", title: "Ancestor Frequency", styles: ["Bold","Abstract","Colorful"], colors: ["Gold","Red","Black"], w: 48, h: 48, tier: "Collector", price: 5800, desc: "Geometric patterns from West African textile traditions." },
  { artist: "James Okafor", title: "City Pulse", styles: ["Bold","Modern","Colorful"], colors: ["Yellow","Blue","Red"], w: 36, h: 36, tier: "Premium", price: 2800, desc: "Urban energy distilled into rhythmic blocks of color." },
  { artist: "James Okafor", title: "Quiet Power", styles: ["Modern","Bold"], colors: ["Black","Gold","White"], w: 30, h: 40, tier: "Premium", price: 2200, desc: "A commanding portrait study in gold and black." },
  { artist: "James Okafor", title: "Market Day", styles: ["Colorful","Bold","Classic"], colors: ["Orange","Green","Yellow"], w: 40, h: 30, tier: "Basic", price: 1400, desc: "The joyful chaos of an open-air market." },
  { artist: "James Okafor", title: "Indigo Memory", styles: ["Abstract","Calm"], colors: ["Blue","Purple","White"], w: 24, h: 36, tier: "Basic", price: 980, desc: "Deep indigo forms evoking traditional indigo dyeing." },
  { artist: "James Okafor", title: "Crown", styles: ["Bold","Modern","Abstract"], colors: ["Gold","Black","Red"], w: 36, h: 48, tier: "Collector", price: 4600, desc: "An abstract crown symbolizing resilience and sovereignty." },
  { artist: "James Okafor", title: "Dialogue", styles: ["Modern","Minimal"], colors: ["Black","White","Gold"], w: 20, h: 30, tier: "Basic", price: 750, desc: "Two abstract forms in visual conversation." },
  { artist: "Yuki Tanaka", title: "Ink Cloud", styles: ["Minimal","Calm","Abstract"], colors: ["Black","White"], w: 30, h: 40, tier: "Premium", price: 1900, desc: "Sumi ink disperses in a frozen moment." },
  { artist: "Yuki Tanaka", title: "Sakura Drift", styles: ["Nature","Calm","Minimal"], colors: ["Pink","White","Neutral"], w: 24, h: 36, tier: "Basic", price: 1100, desc: "Cherry blossom petals caught mid-fall." },
  { artist: "Yuki Tanaka", title: "Digital Garden", styles: ["Modern","Colorful","Abstract"], colors: ["Teal","Pink","Purple"], w: 36, h: 36, tier: "Premium", price: 2400, desc: "Botanical motifs reimagined through digital processes." },
  { artist: "Yuki Tanaka", title: "Karesansui", styles: ["Minimal","Calm"], colors: ["White","Neutral","Black"], w: 48, h: 24, tier: "Collector", price: 3600, desc: "A Zen rock garden abstracted to its essence." },
  { artist: "Yuki Tanaka", title: "Wave Form", styles: ["Abstract","Bold","Modern"], colors: ["Blue","White","Black"], w: 40, h: 30, tier: "Premium", price: 2000, desc: "A contemporary interpretation of the great wave motif." },
  { artist: "Yuki Tanaka", title: "Mono No Aware", styles: ["Minimal","Calm","Nature"], colors: ["Neutral","White","Pink"], w: 20, h: 30, tier: "Basic", price: 850, desc: "The bittersweet beauty of impermanence." },
  { artist: "Yuki Tanaka", title: "Neon Koi", styles: ["Bold","Modern","Colorful"], colors: ["Orange","Pink","Blue"], w: 30, h: 40, tier: "Premium", price: 2100, desc: "Traditional koi rendered in electric neon tones." },
  { artist: "Camille Dupont", title: "Proven\u00e7al Light", styles: ["Classic","Nature","Calm"], colors: ["Yellow","Blue","Green"], w: 36, h: 28, tier: "Premium", price: 2300, desc: "Sun-drenched lavender fields beneath blue sky." },
  { artist: "Camille Dupont", title: "Paris Nocturne", styles: ["Classic","Calm"], colors: ["Blue","Gold","Black"], w: 40, h: 30, tier: "Collector", price: 3800, desc: "Rain-glazed boulevards of the City of Light." },
  { artist: "Camille Dupont", title: "Still Life with Peonies", styles: ["Classic","Nature","Colorful"], colors: ["Pink","Green","White"], w: 24, h: 30, tier: "Basic", price: 1200, desc: "Lush peonies in full bloom." },
  { artist: "Camille Dupont", title: "Coastal Reverie", styles: ["Nature","Calm","Classic"], colors: ["Blue","White","Neutral"], w: 48, h: 36, tier: "Collector", price: 4100, desc: "Atlantic waves meet rocky coastline." },
  { artist: "Camille Dupont", title: "Autumn Passage", styles: ["Nature","Classic","Colorful"], colors: ["Orange","Red","Gold"], w: 30, h: 40, tier: "Premium", price: 2500, desc: "A tree-lined path ablaze with autumn color." },
  { artist: "Camille Dupont", title: "Morning Table", styles: ["Classic","Minimal","Calm"], colors: ["White","Neutral","Blue"], w: 20, h: 24, tier: "Basic", price: 780, desc: "Simple breakfast objects bathed in morning light." },
  { artist: "Camille Dupont", title: "Le Jardin Secret", styles: ["Nature","Classic"], colors: ["Green","Pink","Purple"], w: 36, h: 48, tier: "Collector", price: 4800, desc: "A hidden garden lush with color and dappled light." },
  { artist: "Leo Petrov", title: "Tesseract", styles: ["Modern","Abstract","Bold"], colors: ["Black","White","Red"], w: 40, h: 40, tier: "Premium", price: 2600, desc: "A four-dimensional cube unfolds across the canvas." },
  { artist: "Leo Petrov", title: "Spectrum Shift", styles: ["Modern","Colorful","Abstract"], colors: ["Red","Blue","Yellow"], w: 48, h: 36, tier: "Collector", price: 4200, desc: "Colors transition across geometric planes." },
  { artist: "Leo Petrov", title: "Void Study", styles: ["Minimal","Modern","Abstract"], colors: ["Black","White"], w: 30, h: 30, tier: "Basic", price: 1050, desc: "What remains when everything unnecessary is removed." },
  { artist: "Leo Petrov", title: "Chromatic Architecture", styles: ["Modern","Bold","Colorful"], colors: ["Teal","Orange","Purple"], w: 36, h: 48, tier: "Premium", price: 2900, desc: "Impossible architectural forms in vibrant colors." },
  { artist: "Leo Petrov", title: "Binary", styles: ["Modern","Minimal"], colors: ["Black","White"], w: 24, h: 48, tier: "Premium", price: 1800, desc: "Two vertical panels exploring the duality of vision." },
  { artist: "Leo Petrov", title: "Red Square Variations", styles: ["Modern","Bold","Abstract"], colors: ["Red","Black","White"], w: 20, h: 20, tier: "Basic", price: 680, desc: "A homage to Malevich reimagined." },
  { artist: "Leo Petrov", title: "Infinite Regression", styles: ["Modern","Abstract","Minimal"], colors: ["White","Neutral","Black"], w: 40, h: 40, tier: "Collector", price: 3900, desc: "Nested geometric forms create infinite depth." },
  { artist: "Nia Williams", title: "Sunday Market", styles: ["Photography","Colorful","Bold"], colors: ["Orange","Green","Yellow"], w: 30, h: 30, tier: "Basic", price: 750, desc: "Vibrant produce stalls burst with color." },
  { artist: "Nia Williams", title: "Rain on Brick Lane", styles: ["Photography","Modern"], colors: ["Blue","Neutral","Black"], w: 24, h: 36, tier: "Basic", price: 880, desc: "London rain transforms a famous street." },
  { artist: "Nia Williams", title: "Golden Thread", styles: ["Photography","Bold","Colorful"], colors: ["Gold","Red","Black"], w: 36, h: 24, tier: "Premium", price: 1600, desc: "A textile artist's hands weave gold thread." },
  { artist: "Nia Williams", title: "Brixton Blue Hour", styles: ["Photography","Calm","Modern"], colors: ["Blue","Purple","Pink"], w: 40, h: 30, tier: "Premium", price: 2000, desc: "The magical moment between day and night." },
  { artist: "Nia Williams", title: "Greenhouse Portrait", styles: ["Photography","Nature","Calm"], colors: ["Green","White","Neutral"], w: 30, h: 40, tier: "Premium", price: 1900, desc: "A figure among tropical plants." },
  { artist: "Nia Williams", title: "Chalk Dust", styles: ["Photography","Black & White","Bold"], colors: ["Black","White"], w: 36, h: 36, tier: "Collector", price: 3200, desc: "A dancer captured mid-leap in chalk dust." },
  { artist: "Nia Williams", title: "Window Light", styles: ["Photography","Minimal","Calm"], colors: ["White","Neutral"], w: 20, h: 30, tier: "Basic", price: 620, desc: "Soft window light falls across a simple interior." },
];

for (let i = 0; i < artworkSeed.length; i++) {
  const a = artworkSeed[i];
  const imgId = 100 + i;
  const images = JSON.stringify([
    `https://picsum.photos/seed/art${imgId}/800/600`,
    `https://picsum.photos/seed/art${imgId}b/800/600`,
    `https://picsum.photos/seed/art${imgId}c/800/600`,
  ]);
  await db.execute({
    sql: "INSERT INTO artworks (id, title, artist_id, image_urls, styles, colors, width, height, tier, description, retail_price, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
    args: [id(), a.title, artistIds[a.artist], images, JSON.stringify(a.styles), JSON.stringify(a.colors), a.w, a.h, a.tier, a.desc, a.price],
  });
}

console.log(`Seeded ${artworkSeed.length} artworks, ${artistData.length} artists, 6 plans, 1 demo user`);
console.log("Login: demo@atelier-rote.com / password123");
