# Fitness Data

A personal fitness analytics backend. Pulls activity data from Strava, and eventually Garmin and Apple Health. Stores everything in Supabase and builds charts and analysis on top.

The goal is simple: get all your fitness data in one place and see it clearly. Strava is great for recording, but not great for analysis. This tries to fill that gap.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + JSONB)
- **Charting**: Recharts
- **Styling**: Emotion (CSS-in-JS)
- **UI Components**: Radix UI primitives
- **Auth**: Strava OAuth 2.0

## Getting Started

```bash
npm install
npm run dev
```

Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Open [http://localhost:3000](http://localhost:3000)

## What it does

- Weekly distance chart with activity drill-down
- Activity explorer with search and filtering
- Raw stream data (GPS, heart rate, elevation, etc.)
- Eventually: multi-source sync (Strava, Garmin, Apple Health)

## Folder structure

```
src/
├── app/
│   ├── stats/        # Weekly distance chart
│   ├── explorer/     # Activity list and search
│   ├── api/          # Auth, DB queries, sync endpoints
│   └── ...
├── lib/
│   ├── strava.ts     # Strava API calls
│   ├── supabase.ts   # Database queries
│   └── analytics.ts  # Data analysis helpers
└── data/strava/raw/  # Raw Strava JSON backups
```

## Commands

```bash
npm run dev     # Start dev server
npm run build   # Build for production

# Load Strava data
node scripts/load-strava-data.js
```

## Next steps

- Add Garmin support (they have built-in walk vs run classification)
- Add Apple Health data (sleep, heart rate trends)
- Better handling when the same run comes from multiple sources