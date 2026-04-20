# Atelier Rote

A subscription-based art rental service where users rent curated artwork for their homes and swap pieces seasonally.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Auth:** NextAuth v5 (Credentials provider)
- **State:** Zustand (client) + Server Actions (mutations)
- **Validation:** Zod
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js 18+ (tested on 20/22/24)
- npm

### Installation

```bash
# Install dependencies
npm install

# Create the database and tables
node scripts/setup-db.mjs

# Seed with sample data (8 artists, 57 artworks, 3 plans, 1 demo user)
node scripts/seed.mjs

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Credentials

| Email | Password |
|---|---|
| `demo@atelier-rote.com` | `password123` |

You can also create a new account from the Sign Up page.

### Running Tests

```bash
npm test
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/page.tsx         # Sign in / Sign up
│   ├── onboarding/page.tsx   # Multi-step style quiz
│   ├── discover/page.tsx     # Browse art catalog
│   ├── art/[id]/page.tsx     # Artwork detail + room preview
│   ├── pricing/page.tsx      # Subscription plans
│   ├── checkout/page.tsx     # Mock checkout
│   ├── collection/page.tsx   # My rented artwork
│   ├── swap/page.tsx         # Schedule a swap
│   ├── favorites/page.tsx    # Moodboards
│   └── account/page.tsx      # Profile & subscription
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── nav.tsx               # Top navigation
│   ├── footer.tsx            # Site footer
│   ├── providers.tsx         # Session + theme providers
│   ├── discover-client.tsx   # Catalog filters & grid
│   ├── favorites-client.tsx  # Moodboard interactions
│   ├── artwork-detail-client.tsx
│   ├── room-preview.tsx      # "See in my room" overlay
│   ├── image-carousel.tsx    # Artwork image carousel
│   └── account-client.tsx    # Account actions
├── lib/
│   ├── schema.ts             # Drizzle ORM schema
│   ├── db.ts                 # Database connection
│   ├── auth.ts               # NextAuth configuration
│   ├── actions.ts            # Server actions
│   ├── store.ts              # Zustand stores
│   ├── recommendations.ts    # Artwork scoring engine
│   ├── validations.ts        # Zod schemas
│   └── __tests__/            # Vitest tests
└── types/
    └── next-auth.d.ts        # Auth type extensions
```

## Features

### User Flow

1. **Landing** — Hero, sample artwork showcase, how it works, pricing preview
2. **Auth** — Email/password sign in or account creation
3. **Onboarding** — 4-step wizard: style preferences, color palette, room details, budget tier
4. **Discover** — Search, filter, sort the art catalog with personalized recommendations
5. **Artwork Detail** — Large images, artist info, "See in my room" preview, add to collection/favorites
6. **Pricing** — Residential (Starter/Signature/Collector Concierge) + Commercial (Brand Refresh/Signature Environment/Full Atmosphere)
7. **Checkout** — Mock payment flow, subscription activation
8. **My Collection** — View rented artwork, swap history, schedule swaps
9. **Swap** — Pick a date/time, choose delivery method
10. **Favorites** — Moodboard with named boards
11. **Account** — Profile management, subscription status, cancel

### Business Logic

- **Recommendations:** Scoring based on style/color overlap, size fit vs wall dimensions, and tier match
- **Plan Limits:** Users cannot exceed their plan's piece allowance
- **Swaps:** Active items are returned, artwork availability is toggled
- **Favorites:** Organize into named boards

### Subscription Plans

**Residential**

| Plan | Price | Pieces | Rotation | Insurance |
|---|---|---|---|---|
| Starter | $89/mo | 1–3 | Every 6 months | Standard |
| Signature | $189/mo | 4–8 | Every 3 months | Enhanced |
| Collector Concierge | $349/mo | 8+ | Flexible | Premium |

**Commercial**

| Plan | Price | Pieces | Rotation | Insurance |
|---|---|---|---|---|
| Brand Refresh | $299/mo | 5–12 | Quarterly | Commercial |
| Signature Environment | $549/mo | 12–25 | Biannual/Quarterly | Commercial Plus |
| Full Atmosphere | Custom | 25+ | Ongoing | Enterprise |

## Database

SQLite database stored at `prisma/dev.db`. To reset:

```bash
# Delete the database
rm prisma/dev.db

# Recreate and re-seed
node scripts/setup-db.mjs
node scripts/seed.mjs
```
