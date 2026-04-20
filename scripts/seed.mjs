import Database from "better-sqlite3";
import { hashSync } from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function id() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

// Clear existing data
db.exec("DELETE FROM favorites");
db.exec("DELETE FROM boards");
db.exec("DELETE FROM swap_orders");
db.exec("DELETE FROM collection_items");
db.exec("DELETE FROM subscriptions");
db.exec("DELETE FROM onboarding_profiles");
db.exec("DELETE FROM artworks");
db.exec("DELETE FROM artists");
db.exec("DELETE FROM plans");
db.exec("DELETE FROM users");

// Seed Plans
const insertPlan = db.prepare(
  `INSERT INTO plans (id, name, category, monthly_price, setup_fee, pieces_min, pieces_max, pieces_allowed, swaps_per_year, rotation_schedule, features, insurance_level, purchase_discount, featured)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// ── Residential ──
insertPlan.run(id(), "Essential", "residential",
  149, 199, 2, 3, 3, 2,
  "Every 6 months",
  JSON.stringify(["2\u20133 pieces", "Rotation every 6 months", "One style consultation", "Standard delivery & install", "Access to curated capsule collection"]),
  "Standard", 0, 0
);
insertPlan.run(id(), "Signature", "residential",
  299, 299, 4, 6, 6, 2,
  "Every 6 months",
  JSON.stringify(["4\u20136 pieces", "Rotation every 6 months", "Curated per room", "Optional frame upgrades", "Buyout credit built in"]),
  "Enhanced", 0.10, 1
);
insertPlan.run(id(), "Concierge", "residential",
  599, 500, 7, 12, 12, 4,
  "Flexible",
  JSON.stringify(["7\u201312 pieces", "Priority curation", "Flexible rotation schedule", "Room-by-room styling", "Direct access to advisor"]),
  "Premium", 0.15, 0
);

// ── Commercial ──
insertPlan.run(id(), "Brand Basic", "commercial",
  499, 750, 5, 8, 8, 4,
  "Quarterly or semiannual",
  JSON.stringify(["5\u20138 pieces", "Quarterly or semiannual refresh", "Curated to brand palette", "Install & removal included"]),
  "Commercial", 0, 0
);
insertPlan.run(id(), "Brand Signature", "commercial",
  999, 1500, 10, 18, 18, 4,
  "Quarterly",
  JSON.stringify(["10\u201318 pieces", "Curated to brand identity", "Creative direction included", "Quarterly rotation", "Priority sourcing"]),
  "Commercial Plus", 0.10, 1
);
insertPlan.run(id(), "Full Atmosphere", "commercial",
  0, 0, 20, null, 100, 12,
  "Ongoing",
  JSON.stringify(["20+ pieces", "Full concept & multi-zone program", "Ongoing rotation schedule", "Dedicated account management", "Custom pricing"]),
  "Enterprise", 0.15, 0
);

// Seed Demo User
const userId = id();
const insertUser = db.prepare(
  "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
);
insertUser.run(userId, "Demo User", "demo@atelier-rote.com", hashSync("password123", 10), Date.now());

// Seed Artists
const artistData = [
  { name: "Elara Voss", bio: "Berlin-based abstract expressionist exploring emotion through color and form. Her work has been featured in galleries across Europe." },
  { name: "Marcus Chen", bio: "Photographer and digital artist from San Francisco. Known for minimalist urban landscapes that reveal hidden geometry in architecture." },
  { name: "Sofia Andersson", bio: "Swedish painter inspired by Nordic light and nature. Her large-scale works blend impressionism with contemporary abstraction." },
  { name: "James Okafor", bio: "Nigerian-American mixed-media artist whose bold compositions explore identity, heritage, and the African diaspora." },
  { name: "Yuki Tanaka", bio: "Tokyo-born artist working with ink and digital media. Her pieces balance traditional Japanese aesthetics with modern minimalism." },
  { name: "Camille Dupont", bio: "French oil painter known for dreamlike landscapes and atmospheric studies in light and shadow." },
  { name: "Leo Petrov", bio: "Russian contemporary artist creating striking geometric compositions that play with perception and spatial illusion." },
  { name: "Nia Williams", bio: "London-based photographer capturing intimate moments of everyday beauty through bold color and candid composition." },
];

const artistIds = {};
const insertArtist = db.prepare("INSERT INTO artists (id, name, bio) VALUES (?, ?, ?)");
for (const a of artistData) {
  const aid = id();
  artistIds[a.name] = aid;
  insertArtist.run(aid, a.name, a.bio);
}

// Artwork seed data
const styleOptions = ["Minimal", "Abstract", "Modern", "Classic", "Colorful", "Black & White", "Photography", "Nature", "Bold", "Calm"];
const colorOptions = ["Red", "Blue", "Green", "Yellow", "Black", "White", "Orange", "Purple", "Pink", "Teal", "Gold", "Neutral"];
const tiers = ["Basic", "Premium", "Collector"];

const artworkSeed = [
  // Elara Voss
  { artist: "Elara Voss", title: "Vermillion Dreams", styles: ["Abstract", "Bold", "Colorful"], colors: ["Red", "Orange", "Gold"], w: 36, h: 48, tier: "Premium", price: 2400, desc: "A sweeping abstract canvas pulsing with warm vermillion tones that seem to glow from within." },
  { artist: "Elara Voss", title: "Stillness in Blue", styles: ["Abstract", "Calm", "Minimal"], colors: ["Blue", "White", "Teal"], w: 40, h: 30, tier: "Collector", price: 3800, desc: "Layered blues and whites create a meditative surface that shifts with ambient light." },
  { artist: "Elara Voss", title: "Fragment No. 7", styles: ["Abstract", "Modern"], colors: ["Black", "White", "Gold"], w: 24, h: 24, tier: "Basic", price: 950, desc: "Part of Voss's celebrated Fragments series — a study in contrast and negative space." },
  { artist: "Elara Voss", title: "Ember Field", styles: ["Abstract", "Bold"], colors: ["Red", "Black", "Orange"], w: 48, h: 36, tier: "Premium", price: 2800, desc: "Dynamic gestural strokes evoke a landscape consumed by elemental force." },
  { artist: "Elara Voss", title: "Soft Horizon", styles: ["Abstract", "Calm", "Nature"], colors: ["Pink", "Neutral", "White"], w: 60, h: 40, tier: "Collector", price: 4200, desc: "A large-format piece suggesting a distant horizon dissolving into atmospheric haze." },
  { artist: "Elara Voss", title: "Resonance I", styles: ["Abstract", "Minimal"], colors: ["Teal", "White"], w: 30, h: 40, tier: "Basic", price: 1100, desc: "Concentric forms in cool teal create a visual rhythm that quiets the mind." },
  { artist: "Elara Voss", title: "Golden Hour Study", styles: ["Abstract", "Colorful"], colors: ["Gold", "Orange", "Yellow"], w: 20, h: 20, tier: "Basic", price: 780, desc: "A small but luminous study capturing the warmth of late afternoon light." },

  // Marcus Chen
  { artist: "Marcus Chen", title: "Grid City", styles: ["Photography", "Modern", "Minimal"], colors: ["Black", "White", "Neutral"], w: 30, h: 40, tier: "Basic", price: 850, desc: "An aerial photograph transforming a city block into an abstract geometric pattern." },
  { artist: "Marcus Chen", title: "Reflected Symmetry", styles: ["Photography", "Modern"], colors: ["Blue", "White", "Black"], w: 36, h: 24, tier: "Premium", price: 1800, desc: "A perfectly mirrored reflection in glass and water creates a disorienting sense of infinity." },
  { artist: "Marcus Chen", title: "Concrete Poetry", styles: ["Photography", "Minimal", "Modern"], colors: ["Neutral", "Black", "White"], w: 24, h: 36, tier: "Basic", price: 920, desc: "Brutalist architecture rendered with tenderness — finding beauty in raw concrete forms." },
  { artist: "Marcus Chen", title: "Neon Nocturne", styles: ["Photography", "Bold", "Colorful"], colors: ["Pink", "Purple", "Blue"], w: 40, h: 30, tier: "Premium", price: 2200, desc: "Rain-slicked streets glow with reflected neon in this cinematic nightscape." },
  { artist: "Marcus Chen", title: "Morning Fog, Pier 7", styles: ["Photography", "Calm", "Nature"], colors: ["White", "Neutral", "Blue"], w: 48, h: 32, tier: "Collector", price: 3200, desc: "The San Francisco waterfront disappears into luminous morning fog." },
  { artist: "Marcus Chen", title: "Shadow Lines", styles: ["Photography", "Black & White", "Minimal"], colors: ["Black", "White"], w: 20, h: 30, tier: "Basic", price: 680, desc: "Hard shadows from a fire escape create a striking rhythm across a white wall." },
  { artist: "Marcus Chen", title: "Rust & Glass", styles: ["Photography", "Modern"], colors: ["Orange", "Teal", "Neutral"], w: 30, h: 30, tier: "Premium", price: 1650, desc: "The patinated surface of industrial decay contrasts with sleek modern architecture." },
  { artist: "Marcus Chen", title: "Vanishing Point", styles: ["Photography", "Minimal", "Modern"], colors: ["White", "Neutral"], w: 36, h: 48, tier: "Collector", price: 3500, desc: "A corridor stretches toward infinity in this meditation on perspective and emptiness." },

  // Sofia Andersson
  { artist: "Sofia Andersson", title: "Midnight Sun", styles: ["Nature", "Calm", "Classic"], colors: ["Blue", "Gold", "Purple"], w: 48, h: 36, tier: "Collector", price: 4500, desc: "The ethereal light of a Scandinavian summer night rendered in luminous oils." },
  { artist: "Sofia Andersson", title: "Birch Forest", styles: ["Nature", "Calm"], colors: ["White", "Green", "Neutral"], w: 36, h: 48, tier: "Premium", price: 2600, desc: "Slender birch trunks rise through dappled light in this serene woodland scene." },
  { artist: "Sofia Andersson", title: "Winter Light No. 3", styles: ["Minimal", "Calm", "Nature"], colors: ["White", "Blue", "Neutral"], w: 40, h: 30, tier: "Premium", price: 2100, desc: "Pale winter light suffuses a snowy landscape, nearly dissolving form into pure luminance." },
  { artist: "Sofia Andersson", title: "Spring Thaw", styles: ["Nature", "Colorful"], colors: ["Green", "Blue", "Yellow"], w: 30, h: 40, tier: "Basic", price: 1200, desc: "Fresh greens and clear blues celebrate the return of color after a long Nordic winter." },
  { artist: "Sofia Andersson", title: "Archipelago", styles: ["Nature", "Abstract", "Calm"], colors: ["Blue", "Teal", "White"], w: 60, h: 40, tier: "Collector", price: 5200, desc: "Islands scattered across a vast seascape, abstracted into essential forms of land and water." },
  { artist: "Sofia Andersson", title: "Northern Moss", styles: ["Nature", "Minimal"], colors: ["Green", "Neutral", "White"], w: 24, h: 24, tier: "Basic", price: 890, desc: "A close-up study of moss and lichen rendered with exquisite textural detail." },
  { artist: "Sofia Andersson", title: "Fjord at Dusk", styles: ["Nature", "Classic", "Calm"], colors: ["Purple", "Blue", "Gold"], w: 40, h: 30, tier: "Premium", price: 2400, desc: "Deepening twilight colors reflect in still fjord waters below snow-capped peaks." },

  // James Okafor
  { artist: "James Okafor", title: "Ancestor Frequency", styles: ["Bold", "Abstract", "Colorful"], colors: ["Gold", "Red", "Black"], w: 48, h: 48, tier: "Collector", price: 5800, desc: "Vibrant geometric patterns drawn from West African textile traditions pulse with ancestral energy." },
  { artist: "James Okafor", title: "City Pulse", styles: ["Bold", "Modern", "Colorful"], colors: ["Yellow", "Blue", "Red"], w: 36, h: 36, tier: "Premium", price: 2800, desc: "The frenetic energy of urban life distilled into rhythmic blocks of saturated color." },
  { artist: "James Okafor", title: "Quiet Power", styles: ["Modern", "Bold"], colors: ["Black", "Gold", "White"], w: 30, h: 40, tier: "Premium", price: 2200, desc: "A commanding portrait study in gold and black that radiates dignity and strength." },
  { artist: "James Okafor", title: "Market Day", styles: ["Colorful", "Bold", "Classic"], colors: ["Orange", "Green", "Yellow"], w: 40, h: 30, tier: "Basic", price: 1400, desc: "The joyful chaos of an open-air market rendered in a riot of warm color." },
  { artist: "James Okafor", title: "Indigo Memory", styles: ["Abstract", "Calm"], colors: ["Blue", "Purple", "White"], w: 24, h: 36, tier: "Basic", price: 980, desc: "Deep indigo forms float in white space, evoking the traditional art of indigo dyeing." },
  { artist: "James Okafor", title: "Crown", styles: ["Bold", "Modern", "Abstract"], colors: ["Gold", "Black", "Red"], w: 36, h: 48, tier: "Collector", price: 4600, desc: "An abstract crown form composed of layered geometric elements symbolizing resilience and sovereignty." },
  { artist: "James Okafor", title: "Dialogue", styles: ["Modern", "Minimal"], colors: ["Black", "White", "Gold"], w: 20, h: 30, tier: "Basic", price: 750, desc: "Two abstract forms engage in visual conversation across a field of warm gold." },

  // Yuki Tanaka
  { artist: "Yuki Tanaka", title: "Ink Cloud", styles: ["Minimal", "Calm", "Abstract"], colors: ["Black", "White"], w: 30, h: 40, tier: "Premium", price: 1900, desc: "Sumi ink disperses through water in a frozen moment of beautiful chaos." },
  { artist: "Yuki Tanaka", title: "Sakura Drift", styles: ["Nature", "Calm", "Minimal"], colors: ["Pink", "White", "Neutral"], w: 24, h: 36, tier: "Basic", price: 1100, desc: "Cherry blossom petals caught mid-fall, rendered in delicate washes of pale pink." },
  { artist: "Yuki Tanaka", title: "Digital Garden", styles: ["Modern", "Colorful", "Abstract"], colors: ["Teal", "Pink", "Purple"], w: 36, h: 36, tier: "Premium", price: 2400, desc: "Traditional botanical motifs reimagined through digital processes and glitch aesthetics." },
  { artist: "Yuki Tanaka", title: "Karesansui", styles: ["Minimal", "Calm"], colors: ["White", "Neutral", "Black"], w: 48, h: 24, tier: "Collector", price: 3600, desc: "A Zen rock garden abstracted to its essence — raked lines and singular forms in vast space." },
  { artist: "Yuki Tanaka", title: "Wave Form", styles: ["Abstract", "Bold", "Modern"], colors: ["Blue", "White", "Black"], w: 40, h: 30, tier: "Premium", price: 2000, desc: "A contemporary interpretation of the great wave motif using algorithmic brush strokes." },
  { artist: "Yuki Tanaka", title: "Mono No Aware", styles: ["Minimal", "Calm", "Nature"], colors: ["Neutral", "White", "Pink"], w: 20, h: 30, tier: "Basic", price: 850, desc: "The bittersweet beauty of impermanence captured in fading botanical forms." },
  { artist: "Yuki Tanaka", title: "Neon Koi", styles: ["Bold", "Modern", "Colorful"], colors: ["Orange", "Pink", "Blue"], w: 30, h: 40, tier: "Premium", price: 2100, desc: "Traditional koi rendered in electric neon tones — tradition meets Tokyo street culture." },

  // Camille Dupont
  { artist: "Camille Dupont", title: "Provençal Light", styles: ["Classic", "Nature", "Calm"], colors: ["Yellow", "Blue", "Green"], w: 36, h: 28, tier: "Premium", price: 2300, desc: "Sun-drenched lavender fields beneath an impossibly blue sky, painted en plein air." },
  { artist: "Camille Dupont", title: "Paris Nocturne", styles: ["Classic", "Calm"], colors: ["Blue", "Gold", "Black"], w: 40, h: 30, tier: "Collector", price: 3800, desc: "The City of Light lives up to its name in this atmospheric view of rain-glazed boulevards." },
  { artist: "Camille Dupont", title: "Still Life with Peonies", styles: ["Classic", "Nature", "Colorful"], colors: ["Pink", "Green", "White"], w: 24, h: 30, tier: "Basic", price: 1200, desc: "Lush peonies in full bloom, painted with the confidence of the French still-life tradition." },
  { artist: "Camille Dupont", title: "Coastal Reverie", styles: ["Nature", "Calm", "Classic"], colors: ["Blue", "White", "Neutral"], w: 48, h: 36, tier: "Collector", price: 4100, desc: "Atlantic waves meet rocky Breton coastline in this masterful study of moving water." },
  { artist: "Camille Dupont", title: "Autumn Passage", styles: ["Nature", "Classic", "Colorful"], colors: ["Orange", "Red", "Gold"], w: 30, h: 40, tier: "Premium", price: 2500, desc: "A tree-lined path ablaze with autumn color, inviting the viewer to step inside." },
  { artist: "Camille Dupont", title: "Morning Table", styles: ["Classic", "Minimal", "Calm"], colors: ["White", "Neutral", "Blue"], w: 20, h: 24, tier: "Basic", price: 780, desc: "Simple breakfast objects bathed in morning light — a quiet celebration of daily ritual." },
  { artist: "Camille Dupont", title: "Le Jardin Secret", styles: ["Nature", "Classic"], colors: ["Green", "Pink", "Purple"], w: 36, h: 48, tier: "Collector", price: 4800, desc: "A hidden garden viewed through an archway, lush with color and dappled light." },

  // Leo Petrov
  { artist: "Leo Petrov", title: "Tesseract", styles: ["Modern", "Abstract", "Bold"], colors: ["Black", "White", "Red"], w: 40, h: 40, tier: "Premium", price: 2600, desc: "A four-dimensional cube unfolds across the canvas in precise geometric construction." },
  { artist: "Leo Petrov", title: "Spectrum Shift", styles: ["Modern", "Colorful", "Abstract"], colors: ["Red", "Blue", "Yellow"], w: 48, h: 36, tier: "Collector", price: 4200, desc: "Colors transition seamlessly across geometric planes, creating an optical illusion of depth." },
  { artist: "Leo Petrov", title: "Void Study", styles: ["Minimal", "Modern", "Abstract"], colors: ["Black", "White"], w: 30, h: 30, tier: "Basic", price: 1050, desc: "A stark exploration of negative space — what remains when everything unnecessary is removed." },
  { artist: "Leo Petrov", title: "Chromatic Architecture", styles: ["Modern", "Bold", "Colorful"], colors: ["Teal", "Orange", "Purple"], w: 36, h: 48, tier: "Premium", price: 2900, desc: "Impossible architectural forms rendered in vibrant complementary colors." },
  { artist: "Leo Petrov", title: "Binary", styles: ["Modern", "Minimal"], colors: ["Black", "White"], w: 24, h: 48, tier: "Premium", price: 1800, desc: "Two vertical panels — one black, one white — explore the fundamental duality of vision." },
  { artist: "Leo Petrov", title: "Red Square Variations", styles: ["Modern", "Bold", "Abstract"], colors: ["Red", "Black", "White"], w: 20, h: 20, tier: "Basic", price: 680, desc: "A homage to Malevich reimagined through contemporary geometric sensibility." },
  { artist: "Leo Petrov", title: "Infinite Regression", styles: ["Modern", "Abstract", "Minimal"], colors: ["White", "Neutral", "Black"], w: 40, h: 40, tier: "Collector", price: 3900, desc: "Nested geometric forms create a dizzying sense of infinite depth and scale." },

  // Nia Williams
  { artist: "Nia Williams", title: "Sunday Market", styles: ["Photography", "Colorful", "Bold"], colors: ["Orange", "Green", "Yellow"], w: 30, h: 30, tier: "Basic", price: 750, desc: "Vibrant produce stalls burst with color in this warm, inviting street photograph." },
  { artist: "Nia Williams", title: "Rain on Brick Lane", styles: ["Photography", "Modern"], colors: ["Blue", "Neutral", "Black"], w: 24, h: 36, tier: "Basic", price: 880, desc: "London rain transforms a famous street into a mirror of light and reflection." },
  { artist: "Nia Williams", title: "Golden Thread", styles: ["Photography", "Bold", "Colorful"], colors: ["Gold", "Red", "Black"], w: 36, h: 24, tier: "Premium", price: 1600, desc: "A textile artist's hands weave gold thread — a portrait of craft and dedication." },
  { artist: "Nia Williams", title: "Brixton Blue Hour", styles: ["Photography", "Calm", "Modern"], colors: ["Blue", "Purple", "Pink"], w: 40, h: 30, tier: "Premium", price: 2000, desc: "The magical moment between day and night captured over South London rooftops." },
  { artist: "Nia Williams", title: "Greenhouse Portrait", styles: ["Photography", "Nature", "Calm"], colors: ["Green", "White", "Neutral"], w: 30, h: 40, tier: "Premium", price: 1900, desc: "A figure among tropical plants in a Victorian greenhouse — lush and contemplative." },
  { artist: "Nia Williams", title: "Chalk Dust", styles: ["Photography", "Black & White", "Bold"], colors: ["Black", "White"], w: 36, h: 36, tier: "Collector", price: 3200, desc: "A dancer captured mid-leap in a cloud of chalk dust — frozen kinetic energy." },
  { artist: "Nia Williams", title: "Window Light", styles: ["Photography", "Minimal", "Calm"], colors: ["White", "Neutral"], w: 20, h: 30, tier: "Basic", price: 620, desc: "Soft window light falls across a simple interior — an ode to quietude." },
];

const insertArtwork = db.prepare(
  "INSERT INTO artworks (id, title, artist_id, image_urls, styles, colors, width, height, tier, description, retail_price, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
);

for (let i = 0; i < artworkSeed.length; i++) {
  const a = artworkSeed[i];
  const imgId = 100 + i;
  const images = JSON.stringify([
    `https://picsum.photos/seed/art${imgId}/800/600`,
    `https://picsum.photos/seed/art${imgId}b/800/600`,
    `https://picsum.photos/seed/art${imgId}c/800/600`,
  ]);
  insertArtwork.run(
    id(),
    a.title,
    artistIds[a.artist],
    images,
    JSON.stringify(a.styles),
    JSON.stringify(a.colors),
    a.w,
    a.h,
    a.tier,
    a.desc,
    a.price
  );
}

console.log(`Seeded ${artworkSeed.length} artworks, ${artistData.length} artists, 6 plans, 1 demo user`);
console.log("Login: demo@atelier-rote.com / password123");
db.close();
