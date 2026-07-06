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

## Auth
There is no self-serve sign-up — this is a single shared login gate for trusted operators only. Two ways in:

1. **Email + password**: create the user manually in the Supabase dashboard (Authentication → Users → Add user), or via `supabase.auth.admin.createUser` from the CLI/service role. There is no in-app sign-up form by design.
2. **Google OAuth**: enable it once per Supabase project:
   1. Supabase dashboard → Authentication → Providers → Google → toggle **Enabled**.
   2. Create an OAuth Client ID (Web application) in Google Cloud Console; add the Supabase callback URL shown on that provider settings page as an **Authorized redirect URI**.
   3. Paste the Google Client ID and Client Secret into the Supabase provider settings and save.
   4. In Supabase Authentication → URL Configuration, add this app's `/auth/callback` URL (e.g. `https://<your-vercel-domain>/auth/callback` and `http://localhost:3000/auth/callback` for local dev) to the allowed redirect URLs.

No app code changes are needed to add more OAuth providers later — `signInWithGoogle` in `app/actions/auth.ts` is a thin wrapper around `supabase.auth.signInWithOAuth`; the same pattern extends to other providers once they're enabled in the dashboard.

## Deployment wiring
The GitHub remote is configured on `main` at `https://github.com/francis0844/rescrape.git`.
This local session cannot inspect the Vercel dashboard, so confirm auto-deploy with:

1. Create or open the Vercel project.
2. Connect it to `francis0844/rescrape`.
3. Set the production branch to `main`.
4. Add the environment variables from `.env.example` in Vercel project settings.
5. Confirm a push to `main` creates a production deployment.
