
# Mexicano + Winners Court — Supabase + React Starter

This is a minimal starter to run a weekly Mexicano (with Winners Court) as a web app.

## What's included
- Supabase SQL schema with row-level security (RLS) and membership roles.
- React + Vite + TypeScript scaffold.
- Core logic (`engine.ts`) for round advancement with Winners Court mapping and anti-repeat partners (last 3 rounds).
- Scoring model (`scoring.ts`) implementing Court-Weighted + capped margin + bonuses.
- ELO updates per round (`elo.ts`).

## Setup
1) Create a Supabase project. In the SQL editor, paste `supabase/schema.sql` and run.
2) In Supabase → Authentication, enable Email, Google, Apple as desired.
3) Add yourself to `club_memberships` for your club (owner).
4) Copy your Supabase URL and anon key.

## Local dev
```bash
cd app
npm i
npm run dev
```
Create `.env` in `app` with:
```
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Notes
- Individual mode is default; Teams mode can be added later with a toggle.
- Nightly = points table; Season = ELO.
