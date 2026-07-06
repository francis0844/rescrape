# Advanced Web Scraper — Part 1: Source Searching

A budget-controlled, AI-operated tool for discovering **which public sites are worth extracting data from**, before any extraction happens. Part 1 of three (Source Searching → Parsing → Exporting).

**Full spec:** see [`CONTEXT_PLAN.md`](./CONTEXT_PLAN.md). **Task board:** see [`TASKS.md`](./TASKS.md).

## Stack
- Next.js (App Router) + TypeScript on Vercel (free)
- Supabase (Postgres + Auth + Realtime)
- Tavily (search, free tier) — behind a swappable provider interface
- OpenAI (verification agent — paid) — behind a swappable agent interface

## The three phases
1. **Discovery (AI):** keywords → capped searches → site-level candidate sources.
2. **Verification (AI):** crawl each site's public pages → judge extractability → suggest approve/reject.
3. **Review (human):** final approve/reject with AI insight + evidence + sample preview.

## Dev rules (must follow — see CONTEXT_PLAN §9)
`git pull origin main` → read `TASKS.md` → work → commit + `git push origin main` → update `TASKS.md`. Never leave uncommitted work. Secrets via `process.env` only. **All UI goes through the `impeccable` skill.**

## Setup
1. Copy `.env.example` → `.env.local` and fill in keys.
2. Create Supabase project; run migrations.
3. `npm install && npm run dev`.
