# BUILD_PROMPT.md — Phased Build Prompts for "Source Searching" (Phase 1 app)

> **What this file is.** A ready-to-paste set of build prompts for an AI coding tool (**Codex or Claude Code**, used one at a time). It turns `CONTEXT_PLAN.md` into concrete, phase-by-phase work orders. Each phase is a **separate prompt** you paste in a **fresh session** so the model never has to hold the whole app in its head at once — this is deliberate, to keep output accurate and prevent hallucination.
>
> **The single source of truth is still `CONTEXT_PLAN.md`.** These prompts never replace it — they point back to it by section number (e.g. "§4.5"). If a prompt and the plan ever disagree, the plan wins.
>
> **Golden rule for the AI:** *Build only what the current phase asks for. Do not scaffold future phases. Do not invent scope. If a detail is missing, re-read `CONTEXT_PLAN.md` before guessing — and if it is still missing, stop and ask, do not fabricate.*

---

## How to use this document

1. Work phases **in order**: Phase 0 → 1 → 2 → 3 → 4. Do not skip ahead; each phase assumes the previous one is merged to `main`.
2. For each phase, **start a fresh AI session** and paste **only that phase's prompt** (the fenced block under "PROMPT TO PASTE"). Each block already includes the shared context header, so it's paste-ready with no assembly. One phase = one session's mission.
3. Every phase begins and ends with the **standing workflow** (git pull → read `TASKS.md` → work → commit + push → update `TASKS.md`). This is repeated inside each prompt on purpose so a cold session can't miss it.
4. When a phase is done, confirm its **Acceptance checklist** passes before moving on.
5. Phases 1–4 each contain sub-steps. If a session runs low on credit mid-phase, it must leave the repo in a committed, green state and record the next sub-step in `TASKS.md` so the other tool can resume.

### Shared context header (already inlined into every prompt below)

Every "PROMPT TO PASTE" block already begins with this header, so you can copy a phase block straight into a fresh AI session — no assembly needed. It is reproduced here for reference. It is short on purpose — the AI reads the full detail from the repo, not from memory.

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.
```

---

# PHASE 0 — Foundation (maps to TASKS.md Milestone 0)

**Mission:** Stand up an empty-but-correct skeleton: Next.js App Router + TypeScript, Supabase wiring, the full database schema, a login gate, stubbed provider/agent interfaces, and the design system baseline. **No features yet** — no search, no crawl, no review UI.

**Why isolated:** Everything downstream depends on the schema and the interface seams being right. If these are wrong, every later phase inherits the mistake. Keep this phase boring and exact.

### Deliverables (must all exist and be committed)

- Next.js (App Router) + TypeScript project that builds and runs (`npm run dev`), GitHub repo on `main`, Vercel auto-deploy connected.
- `.env.example` listing every variable from CONTEXT_PLAN §11 — **names only, no values**: `TAVILY_API_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase clients: a **browser/anon** client and a **server/service-role** client, in separate modules. The service-role client must be import-guarded so it can never be bundled to the browser.
- **One SQL migration** creating every table in CONTEXT_PLAN §4, exactly: `search_providers`, `app_settings`, `keywords`, `search_runs`, `sources`, `source_discoveries`, `scan_jobs`. Match column names, types, nullability, and the enums in §4 and §6. Seed `search_providers` with a single **Tavily** row (`enabled = true`, `api_key_env = 'TAVILY_API_KEY'`, `default_result_cap = 10`). Seed one `app_settings` row with sane defaults (`result_cap_per_query = 10`, `crawl_max_pages = 15`, `crawl_max_depth = 1`, `crawl_char_budget` reasonable, `chunk_size = 5`, `include_domains = '{}'`).
- **Supabase Auth login gate**: the entire app sits behind login (CONTEXT_PLAN §2 — "not public"). Unauthenticated users are redirected to a sign-in page. Single shared login is fine; no multi-tenant logic, no `owner_id` columns.
- **Stubbed interfaces** (CONTEXT_PLAN §3), each in its own module, with a real TypeScript type and a stub implementation that throws `NotImplemented` (or returns a clearly-marked stub) — **no live API calls in Phase 0**:
  - `SearchProvider` — e.g. `search(query: string, opts): Promise<SearchResult[]>`.
  - `VerificationAgent` — e.g. `judge(input: CrawlBundle): Promise<Verdict>`.
  - A small `getEnabledSearchProviders()` seam that reads the whitelist from `search_providers` (used later to enforce the boundary).
- App shell with the four nav areas as **empty routed pages** only: **Dashboard**, **Keywords**, **Sources**, **Settings** (CONTEXT_PLAN §5 IA). No functionality inside them yet.
- **`impeccable teach` run once** to establish design tokens/type/color/layout for the project, committed as the design baseline (CONTEXT_PLAN §10). The app shell must already use these tokens, not default styling.
- `TASKS.md` updated: T0.1–T0.6 marked done, session log appended.

### Explicit guardrails

- Do **not** build Keywords CRUD, CSV import, search runs, crawling, or review UI in this phase. Empty pages only.
- Do **not** put any real Tavily/OpenAI network call anywhere yet — interfaces are stubs.
- Do **not** add `owner_id` / per-user isolation. Single-tenant, shared global data.
- Do **not** hardcode any domain vocabulary anywhere.
- Do **not** ship default-styled components — run `impeccable teach` first.

### Acceptance checklist (Phase 0 is done when…)

- [ ] `npm run dev` runs; visiting the app while logged out redirects to sign-in; logging in shows the 4-area shell.
- [ ] The migration applies cleanly to a fresh Supabase project and creates all 7 tables + both seed rows with the exact columns/enums from §4/§6.
- [ ] `.env.example` present with all 5 var names and no real values; no secret is committed anywhere.
- [ ] `SearchProvider` and `VerificationAgent` interfaces exist as typed stubs; nothing calls Tavily/OpenAI directly.
- [ ] `impeccable teach` output (design tokens) is committed and the shell uses it.
- [ ] Work is committed and pushed to `main`; `TASKS.md` T0.x marked done + session log entry added.

### PROMPT TO PASTE (Phase 0)

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.

PHASE 0 — FOUNDATION. Implement TASKS.md Milestone 0 (T0.1–T0.6) and nothing beyond it.

Do exactly this, in order:
1. `git pull origin main`; read CONTEXT_PLAN.md (esp. §3 stack, §4 data model, §6 state machine, §11 prerequisites) and TASKS.md. Mark T0.1 in-progress in TASKS.md with your intent, and push.
2. Scaffold Next.js (App Router) + TypeScript. Ensure it builds and `npm run dev` works. Confirm the GitHub repo is on `main` and Vercel auto-deploy is wired (or document the exact steps if you lack access).
3. Add `.env.example` with these names ONLY (no values): TAVILY_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
4. Wire two Supabase clients: browser/anon and server/service-role (service-role must never reach the client bundle).
5. Write ONE SQL migration creating every table in CONTEXT_PLAN §4 exactly (search_providers, app_settings, keywords, search_runs, sources, source_discoveries, scan_jobs) with the enums from §4 and §6. Seed one Tavily provider row (enabled=true, api_key_env='TAVILY_API_KEY', default_result_cap=10) and one app_settings row with sensible defaults (result_cap_per_query=10, crawl_max_pages=15, crawl_max_depth=1, chunk_size=5, include_domains empty).
6. Add a Supabase Auth login gate so the whole app requires login; unauthenticated → sign-in page. No multi-tenant logic, no owner_id.
7. Create stubbed, typed interfaces per CONTEXT_PLAN §3: SearchProvider (search) and VerificationAgent (judge), each in its own module, stub impls that throw NotImplemented. Add getEnabledSearchProviders() that reads the whitelist. NO real API calls this phase.
8. Add empty routed pages for the four nav areas: Dashboard, Keywords, Sources, Settings (CONTEXT_PLAN §5). No features inside them.
9. Run the `impeccable` skill in `impeccable teach` mode to establish design tokens/type/color/layout; commit that baseline and make the shell use it. Do not ship default-styled UI.
10. Update TASKS.md (T0.1–T0.6 done, append session log). Commit + `git push origin main` after each meaningful step.

Do NOT build any Phase 1–4 features. Empty pages + correct schema + stubs + login + design baseline only. Confirm each Phase 0 acceptance item before finishing.
```

---

# PHASE 1 — Settings & Keyword lists (maps to TASKS.md Milestone 1)

**Mission:** Make the two governance surfaces real: the **Search Providers whitelist** + budget/crawl config in **Settings**, and full **Keywords CRUD + CSV import** in **Keywords**. Still no searching or crawling — this phase produces the *inputs* those later phases consume.

**Why isolated:** These are pure CRUD + import correctness. Getting dedup, header mapping, and the enabled-provider boundary right here means Phase 2/3 can trust their inputs.

### Deliverables

**Settings (T1.1, T1.2):**
- Search Providers whitelist CRUD backed by `search_providers`: list, enable/disable, edit `default_result_cap` and `config`, reference the key by **env var name** (`api_key_env`) — **never accept or store the raw key** (CONTEXT_PLAN §4.1). Tavily is the only seeded provider; the UI must not pretend other engines exist yet (§2 out-of-scope).
- Budget/crawl config editor backed by the single `app_settings` row: `result_cap_per_query`, `crawl_max_pages`, `crawl_max_depth`, `crawl_char_budget`, `chunk_size`, and optional `include_domains` (a list; empty = open-web, non-empty = restrict searches to only those domains — CONTEXT_PLAN §4.2).

**Keywords (T1.3, T1.4):**
- CRUD over `keywords`: `topic` (required), `location` (optional), `notes` (optional), `active` (default true). Add/edit/delete/toggle-active. **One row = one query; no auto cross-product or location expansion** (CONTEXT_PLAN §4.3).
- **CSV import** exactly per CONTEXT_PLAN §7:
  - Upload any CSV; app detects columns; user **maps each column** to `topic` / `location` / `notes` / `active`, with auto-detection of common header names and manual override. Offer a downloadable template.
  - **Append + dedup by default.** "Replace all" is a separate, explicitly-confirmed action; never silently wipe.
  - Dedup on **lowercased + trimmed `(topic, location)`**. Existing match → **skip and report** (do not overwrite existing `notes`/`active`).
  - Per-row validation: import good rows, reject bad ones, show a **summary** like "142 added, 8 skipped as duplicates, 3 rejected — row 5: empty topic…". A few bad rows never fail the whole file.
  - `active` defaults to `true` when blank; `topic` is the only required field.
  - Enforce a **row cap** (e.g. 5,000) so a huge upload can't blow up a serverless function.

### Explicit guardrails

- Settings must **never** display, accept, or persist a raw API key — only the env var **name**.
- Do **not** implement auto-expansion of keywords into multiple queries.
- CSV import must **never** silently overwrite or wipe existing keywords; "replace all" requires explicit confirmation.
- Do **not** start building the search run yet (that's Phase 2). No Tavily calls.
- All new UI goes through `impeccable craft` using the Phase 0 design tokens.

### Acceptance checklist

- [ ] Settings can enable/disable Tavily, edit result cap + crawl bounds + `include_domains`; key is referenced by env-var name only.
- [ ] Keywords CRUD works for topic/location/notes/active; topic required; one row = one query.
- [ ] CSV import maps arbitrary headers, dedups on lowercased+trimmed `(topic, location)`, appends by default, reports a per-row summary, enforces the row cap, and never silently overwrites/wipes.
- [ ] UI built via `impeccable craft` (not default styling).
- [ ] Committed + pushed; TASKS.md T1.x done + session log entry.

### PROMPT TO PASTE (Phase 1)

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.

PHASE 1 — SETTINGS & KEYWORD LISTS. Implement TASKS.md Milestone 1 (T1.1–T1.4) only. Phase 0 is merged; build on it.

1. `git pull origin main`; read CONTEXT_PLAN §4.1–§4.3 and §7; read TASKS.md. Mark T1.1 in-progress with intent; push.
2. Settings — Search Providers whitelist CRUD backed by search_providers: list/enable/disable, edit default_result_cap and config, reference the key ONLY by env-var name (api_key_env). Never accept or store a raw key. Only Tavily exists; don't fake other engines.
3. Settings — budget/crawl config editor for the single app_settings row: result_cap_per_query, crawl_max_pages, crawl_max_depth, crawl_char_budget, chunk_size, and optional include_domains (empty = open web; non-empty = restrict to those domains).
4. Keywords — CRUD over keywords (topic required, location/notes optional, active default true; add/edit/delete/toggle). Enforce "one row = one query": NO auto cross-product, NO location expansion.
5. Keywords — CSV import exactly per CONTEXT_PLAN §7: detect columns; let the user map each to topic/location/notes/active with auto-detect + manual override; offer a template download; append + dedup by default; dedup on lowercased+trimmed (topic, location) and skip+report existing matches without overwriting; per-row validation with a summary ("X added, Y skipped, Z rejected — reasons"); active defaults true when blank; topic is the only required field; enforce a ~5,000 row cap; "replace all" is a separate explicitly-confirmed action that must never fire silently.
6. Build all UI with the `impeccable` skill (`impeccable craft`) using the Phase 0 tokens.
7. Update TASKS.md (T1.1–T1.4 done + session log). Commit + push after each step.

Do NOT build search runs, crawling, or review UI. No Tavily/OpenAI calls this phase. Confirm each Phase 1 acceptance item before finishing.
```

---

# PHASE 2 — Discovery: Run Search (maps to TASKS.md Milestone 2)

**Mission:** Implement Phase-1-of-the-app **Discovery agent**: turn active keywords into capped queries, run them through **enabled providers only** (Tavily), dedup results to **site level**, write `sources` + `source_discoveries`, and show a run summary. Handle credit exhaustion gracefully.

**Why isolated:** This is the first phase that spends money (Tavily credits). Getting the **enabled-provider boundary**, **site-level dedup**, and **graceful `partial` stop** right is the whole point of the product ("tight control over where the AI looks, to save money" — CONTEXT_PLAN §1).

### Deliverables

- **Run builder (T2.1):** builds exactly **one query per active keyword** (`topic` + `location` if present). Enforces the hard boundary: only providers with `enabled = true` may be used; disabled providers are rejected/skipped (CONTEXT_PLAN §4.1). Applies `include_domains` scoping from `app_settings` when non-empty. Respects `result_cap_per_query`.
- **Tavily call via the `SearchProvider` interface (T2.2)** — never a direct Tavily call in feature code (CONTEXT_PLAN §3). Requests are capped by result cap.
- **Site-level dedup (T2.2):** normalize each result to its **site root** (e.g. `https://example.com`, not the deep page). A site is one `sources` row keyed by `site_url` UNIQUE. A site found by multiple keywords/runs → **one** `sources` row + **multiple** `source_discoveries` rows; **never a duplicate site, never re-spend on re-discovery** (CONTEXT_PLAN §4.5, §4.6, §8 edge cases).
- **`search_runs` record (T2.3):** create a run row with `status`, `started_at`/`finished_at`, `query_count`, `result_count` (new candidate sites created), `credits_spent_est`, and immutable `keywords_snapshot` + `providers_snapshot` (CONTEXT_PLAN §4.4).
- **Run summary UI (T2.3):** show queries fired, new sites discovered, and estimated credits spent.
- **Graceful credit stop:** if the Tavily cap is hit mid-run, stop cleanly, set run `status = 'partial'`, and show "X of Y done, credit limit reached" (CONTEXT_PLAN §8). Never crash, never leave half-written inconsistent rows.
- New sources are created in `status = 'pending'` (entry state of the §6 state machine).

### Explicit guardrails

- **Only enabled providers.** A disabled provider must be impossible to use — enforce in the run builder, not just the UI.
- **No location/keyword expansion** — one active keyword = one query.
- **No re-spend on re-discovery** — dedup first; only new sites cost credits/rows.
- **Site-level identity only** — store/display the site root, never the deep page URL, as the source identity.
- Do **not** start crawling or judging (that's Phase 3). Discovery ends at `pending` sources.
- Always surface estimated credit spend (budget visibility is a core requirement — §8).

### Acceptance checklist

- [ ] A run fires exactly one query per active keyword through enabled providers only (disabled = impossible).
- [ ] Results dedup to site level; re-running the same keywords adds only genuinely new sites and re-spends nothing (extra `source_discoveries` only).
- [ ] `search_runs` row is written with counts, est. credits, and immutable keyword/provider snapshots.
- [ ] Hitting the Tavily cap stops gracefully as `partial` with a clear "X of Y, credit limit reached" message.
- [ ] New sources land in `pending`; Tavily is only ever called through `SearchProvider`.
- [ ] UI via `impeccable`; committed + pushed; TASKS.md T2.x done + session log.

### PROMPT TO PASTE (Phase 2)

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.

PHASE 2 — DISCOVERY / RUN SEARCH. Implement TASKS.md Milestone 2 (T2.1–T2.3) only. Phases 0–1 are merged.

1. `git pull origin main`; read CONTEXT_PLAN §1 (why), §3 (interfaces), §4.4–§4.6, §6 state machine, §8 edge cases; read TASKS.md. Mark T2.1 in-progress with intent; push.
2. Run builder: one query per ACTIVE keyword (topic + location if present). Enforce the hard boundary — only providers with enabled=true may run; reject/skip disabled ones in the builder itself. Apply include_domains scoping when non-empty. Respect result_cap_per_query. NO keyword/location expansion.
3. Execute searches ONLY through the SearchProvider interface (Tavily impl), capped by result cap. Never call Tavily directly from feature code.
4. Dedup to SITE level: normalize each hit to its site root; sources.site_url is UNIQUE. A site found by multiple keywords/runs = ONE sources row + multiple source_discoveries rows. Never duplicate a site; never re-spend on re-discovery. New sources start in status 'pending'.
5. Write a search_runs row: status, started/finished, query_count, result_count (new sites), credits_spent_est, and immutable keywords_snapshot + providers_snapshot.
6. Run summary UI: queries fired, new sites, estimated credits.
7. Credit exhaustion: if the Tavily cap is reached mid-run, stop cleanly, set run status='partial', show "X of Y done, credit limit reached." Never crash or leave inconsistent rows.
8. Build UI with `impeccable`. Update TASKS.md (T2.1–T2.3 done + session log). Commit + push after each step.

Do NOT crawl or judge sites (that's Phase 3). Discovery ends at 'pending' sources. Confirm each Phase 2 acceptance item before finishing.
```

---

# PHASE 3 — Verification: Scan All Sites (maps to TASKS.md Milestone 3)

**Mission:** Implement the **Verification agent**: a chunked, VM-free **crawl-and-judge** over `pending` sites with **live per-site progress**, producing `ai_verdict` + `ai_confidence` + `ai_reason` + `extractable_fields` + `sample_preview` + `evidence_urls`. This is the most complex phase — hold to the bounds and the edge-case handling exactly.

**Why isolated:** This phase spends OpenAI money and is where scale first breaks (CONTEXT_PLAN §8). It must be a **pure function over `scan_jobs` + `sources`** so it can later move to an Oracle Cloud worker VM without a rewrite. Keep crawl bounds, robots.txt respect, and failure handling faithful to §8 — these are correctness, not polish.

### Deliverables

- **"Scan all sites" action + chunked loop (T3.1):** one button scans all `pending` sites. Create a `scan_jobs` row (`total_sites`, `processed_sites`, `current_source_id`, status). Processing runs in **chunks of `chunk_size`** per serverless invocation, **browser-driven** (the loop advances while the user's tab is open). Closing the tab **pauses** the job; a **Resume** action re-processes remaining `pending`/`scanning` sites **idempotently** (CONTEXT_PLAN §8.2). Keep the worker a pure function of `scan_jobs` + `sources` (VM-portable).
- **Bounded crawler (T3.2):** for each site, fetch public pages with **plain HTTP fetch (free)** first, honoring `crawl_max_pages`, `crawl_max_depth`, and `crawl_char_budget` from `app_settings`. **Respect `robots.txt`** — disallowed sites are **not crawled**; set `needs_review` with reason "crawling disallowed" (CONTEXT_PLAN §8.4/§8 edge cases). For JS-heavy/empty fetches, fall back to **Tavily `/extract`** (via the provider seam) to conserve credits; still empty → `needs_review`.
- **OpenAI judge via `VerificationAgent` interface (T3.3):** feed the bounded crawl bundle to the agent (never a direct OpenAI call — CONTEXT_PLAN §3). Produce and persist on the `sources` row: `ai_verdict` (`approve` | `reject` | `needs_review`), `ai_confidence` (0–1), `ai_reason` (plain-language why), `extractable_fields` (domain-neutral chips), `sample_preview` (small sample of extractable data), `evidence_urls` (the specific public pages crawled to decide), and `last_scanned_at`.
- **State transitions (T3.3):** the agent may only move a source `pending → scanning → {ai_approved | ai_rejected | needs_review}`. It must **never** set `approved`/`rejected` (human-only terminal states — CONTEXT_PLAN §6). No auto-promotion.
- **Live progress via Supabase Realtime (T3.4):** stream the current site + `scan_step` (e.g. "fetching", "crawling 3/15", "judging", "verdict") so the UI shows which site is being scanned and its step in real time (CONTEXT_PLAN §5.5).

### Edge-case handling (all required — from CONTEXT_PLAN §8)

- **robots.txt disallow** → `needs_review`, reason "crawling disallowed" (never crawl anyway).
- **Dead/timeout site** → retry a couple times → `needs_review` with the error; never block the batch.
- **JS-heavy empty fetch** → Tavily `/extract` fallback; still empty → `needs_review`.
- **OpenAI failure/rate-limit** → retry with backoff; repeated failure → **leave the source `pending`** (NOT falsely `ai_rejected`) so Re-scan can retry later.
- **Tab closed mid-scan** → job pauses; **Resume** picks up remaining sites idempotently (no double-spend, no double-write).
- Always keep OpenAI/Tavily spend bounded by the crawl caps; surface progress and (where feasible) estimated spend.

### Explicit guardrails

- Verification is **fuzzy and never ground truth** — its output is a *suggestion* for Phase 3 humans; never treat `ai_approved` as final (§8.1).
- The agent must **never** write human terminal states (`approved`/`rejected`).
- Never call OpenAI or Tavily directly — always via the interfaces.
- Keep the worker a **pure function of `scan_jobs` + `sources`** — no hidden global state — so it can move to a VM later.
- Do **not** build the human review actions/queue here (that's Phase 4); this phase only produces AI verdicts + progress.

### Acceptance checklist

- [ ] "Scan all sites" creates a `scan_jobs` row and processes `pending` sites in chunks of `chunk_size`, browser-driven; Resume re-processes remaining sites idempotently after a tab close.
- [ ] Crawler honors `crawl_max_pages`/`crawl_max_depth`/`crawl_char_budget`, respects robots.txt (disallow → `needs_review`), and falls back to Tavily `/extract` for empty JS pages.
- [ ] Each scanned source gets `ai_verdict`, `ai_confidence`, `ai_reason`, `extractable_fields`, `sample_preview`, `evidence_urls`, `last_scanned_at`.
- [ ] Agent only moves sources among `pending/scanning/ai_approved/ai_rejected/needs_review`; never `approved`/`rejected`.
- [ ] All §8 edge cases behave as specified (dead site, OpenAI failure leaves `pending`, etc.).
- [ ] Live per-site progress streams via Supabase Realtime (current site + `scan_step`).
- [ ] OpenAI/Tavily only via interfaces; worker is a pure function of `scan_jobs` + `sources`.
- [ ] UI via `impeccable`; committed + pushed; TASKS.md T3.x done + session log.

### PROMPT TO PASTE (Phase 3)

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.

PHASE 3 — VERIFICATION / SCAN ALL SITES. Implement TASKS.md Milestone 3 (T3.1–T3.4) only. Phases 0–2 are merged. This is the hardest phase — follow CONTEXT_PLAN §6 and §8 exactly.

1. `git pull origin main`; read CONTEXT_PLAN §3, §4.5, §4.7, §5.5, §6, §8 (all edge cases); read TASKS.md. Mark T3.1 in-progress with intent; push.
2. "Scan all sites": create a scan_jobs row (total_sites, processed_sites, current_source_id, status). Process pending sites in chunks of chunk_size per serverless invocation, browser-driven (advances while the tab is open). Tab close = pause. Add a Resume action that re-processes remaining pending/scanning sites idempotently. Keep the worker a PURE function of scan_jobs + sources so it can move to a VM later.
3. Bounded crawler per site: plain HTTP fetch first, honoring crawl_max_pages, crawl_max_depth, crawl_char_budget. Respect robots.txt — do NOT crawl disallowed sites; set needs_review, reason "crawling disallowed." JS-heavy/empty fetch → fall back to Tavily /extract via the provider seam; still empty → needs_review.
4. Judge via the VerificationAgent (OpenAI) interface ONLY — never call OpenAI directly. Persist on the source: ai_verdict (approve|reject|needs_review), ai_confidence (0–1), ai_reason, extractable_fields (domain-neutral), sample_preview, evidence_urls (pages actually crawled), last_scanned_at.
5. State machine (CONTEXT_PLAN §6): agent may only move a source pending → scanning → {ai_approved|ai_rejected|needs_review}. It must NEVER set approved/rejected (human-only). No auto-promotion.
6. Edge cases (all required): dead/timeout → retry then needs_review, never block batch; OpenAI failure/rate-limit → backoff, and on repeated failure LEAVE the source pending (do NOT falsely reject) so re-scan can retry; robots disallow → needs_review; empty JS → Tavily /extract then needs_review.
7. Live progress via Supabase Realtime: stream current_source_id + scan_step ("fetching" / "crawling X/N" / "judging" / "verdict").
8. Build UI with `impeccable`. Update TASKS.md (T3.1–T3.4 done + session log). Commit + push after each step.

Do NOT build human review actions or the review queue (Phase 4). This phase produces AI verdicts + live progress only. Confirm each Phase 3 acceptance item before finishing.
```

---

# PHASE 4 — Review (human) + Delivery (maps to TASKS.md Milestone 4)

**Mission:** Build the **human review** experience (Phase 3 of the app), the **approved/trusted sources** view, and the **Dashboard**, then do an **end-to-end POC pass** against CONTEXT_PLAN §5 done-criteria and an `impeccable` polish sweep. Humans make the final call — the AI never auto-promotes.

**Why isolated:** This phase is where product quality actually comes from (§8.1). It's mostly UI + human-only state transitions + final integration. Keep the human/AI state separation strict.

### Deliverables

- **Review queue (T4.1):** default filter shows `ai_approved` + `needs_review`. Each site card shows: **site URL** (opens in a new tab), **AI verdict + confidence**, **AI reason**, **extractable-field chips**, **sample-data preview**, **evidence URLs**, and **which keyword/run discovered it** (CONTEXT_PLAN §5.6). Filters: status / keyword / run / confidence.
- **Actions (T4.2):** **Approve**, **Reject**, **Re-scan**, and **note** (`human_note`), plus **bulk approve/reject**. Only a **human** may set the terminal states `approved`/`rejected`; a human may **override** any AI verdict. **Re-scan** resets the source to `scanning`, updates the verdict on completion, and preserves history. **No auto-promotion** — `ai_approved` never becomes `approved` without a human click (CONTEXT_PLAN §6).
- **Approved (trusted) sources (T4.3):** a **saved filter/tab on the Sources table** (not a separate screen) showing every source with `status = 'approved'` — this is the deliverable that feeds the future Parsing phase (CONTEXT_PLAN §4.7 note).
- **Dashboard (T4.4):** counts (e.g. pending / scanning / ai_approved / needs_review / approved / rejected) + recent runs (CONTEXT_PLAN §5 IA).
- **Sources page unifies everything:** Phase-2 "Scan all sites" trigger + Phase-3 review live as **tabs/filters on one Sources table** (CONTEXT_PLAN §5 IA) — not separate screens.
- **End-to-end POC pass + polish (T4.5):** walk the full §5 done-criteria (log in → settings → keywords + CSV import → run search → scan all sites → review → approved tab) and confirm each works; run an `impeccable` polish/extract sweep so the four areas stay visually consistent.

### Explicit guardrails

- **Human-only terminal states.** Nothing but an explicit human click may set `approved`/`rejected`. Bulk approve exists to make human decisions fast — it is still a human action, not auto-promotion.
- **Keep AI and human state separate** — the UI must always be able to show "AI said yes, human hasn't confirmed."
- **Re-scan preserves history** and returns the source to `scanning` (re-uses the Phase 3 worker; don't fork the logic).
- Approved sources are a **filter/tab on Sources**, not a new page.
- Do **not** build Part 2 (Parsing) or Part 3 (Exporting) — out of scope (CONTEXT_PLAN §2). The approved tab is the handoff point and nothing more.
- Final polish must go through `impeccable` — no default-styled screens ship.

### Acceptance checklist

- [ ] Review queue defaults to `ai_approved` + `needs_review` and shows URL / verdict+confidence / reason / field chips / sample preview / evidence URLs / discovering keyword+run, with status/keyword/run/confidence filters.
- [ ] Approve/Reject/Re-scan/note + bulk approve/reject work; only humans set `approved`/`rejected`; humans can override AI; re-scan resets to `scanning` and preserves history; no auto-promotion anywhere.
- [ ] Approved (trusted) sources appear as a saved filter/tab on Sources (not a separate screen).
- [ ] Dashboard shows status counts + recent runs; Sources page hosts scan trigger + review as tabs/filters on one table.
- [ ] Full §5 end-to-end flow passes; `impeccable` polish sweep done; four areas visually consistent.
- [ ] Committed + pushed; TASKS.md T4.x + Milestone 4 done + session log; POC declared complete.

### PROMPT TO PASTE (Phase 4)

```
You are building Phase 1 ("Source Searching") of a three-part, domain-agnostic, budget-controlled web-scraper admin tool.
Authoritative spec: CONTEXT_PLAN.md in the repo root. Task board: TASKS.md. Read both before coding.

Non-negotiable rules (from CONTEXT_PLAN §9):
1. Start every session: `git pull origin main`, then read TASKS.md.
2. Mark the task in-progress in TASKS.md (with intent) BEFORE writing code.
3. Commit + `git push origin main` after each completed change; update TASKS.md; push again.
4. NEVER leave uncommitted work at end of session.
5. NEVER hardcode secrets — `process.env` only. Keys never touch the DB or client bundle.
6. Domain-agnostic: never hardcode any subject matter (no "obituary", "blog", etc. in schema, logic, or copy).
7. Never call Tavily or OpenAI directly from feature code — always go through the SearchProvider / VerificationAgent interfaces (CONTEXT_PLAN §3).
8. All UI/UX goes through the `impeccable` skill (CONTEXT_PLAN §10) — no default-styled screens.
Build ONLY the current phase. Do not scaffold future phases. If unsure, re-read CONTEXT_PLAN.md; if still unclear, stop and ask.

PHASE 4 — REVIEW (HUMAN) + DELIVERY. Implement TASKS.md Milestone 4 (T4.1–T4.5) only. Phases 0–3 are merged.

1. `git pull origin main`; read CONTEXT_PLAN §4.5, §5, §5.6, §6, §8.1, and §4.7 note; read TASKS.md. Mark T4.1 in-progress with intent; push.
2. Review queue: default filter = ai_approved + needs_review. Each source card shows: site URL (opens new tab), AI verdict + confidence, AI reason, extractable-field chips, sample-data preview, evidence URLs, and the discovering keyword/run. Filters: status / keyword / run / confidence.
3. Actions: Approve, Reject, Re-scan, note (human_note) + bulk approve/reject. ONLY humans set terminal approved/rejected; humans may override any AI verdict; keep AI vs human state visibly separate ("AI said yes, human hasn't confirmed"). Re-scan resets to scanning, reuses the Phase 3 worker, updates the verdict, and preserves history. NO auto-promotion — ai_approved never becomes approved without a human click.
4. Approved (trusted) sources: a saved filter/tab on the Sources table (NOT a separate screen) = every source with status='approved'. This is the handoff to the future Parsing phase.
5. Dashboard: status counts + recent runs. Ensure the Sources page hosts the Phase-2 "Scan all sites" trigger and Phase-3 review as tabs/filters on ONE table (CONTEXT_PLAN §5 IA).
6. End-to-end POC pass against CONTEXT_PLAN §5 done-criteria: log in → settings → keywords + CSV import → run search → scan all sites → review → approved tab. Confirm each works. Then run an `impeccable` polish/extract sweep for consistency across Dashboard/Keywords/Sources/Settings.
7. Update TASKS.md (T4.1–T4.5 + Milestone 4 done + session log). Commit + push after each step.

Do NOT build Part 2 (Parsing) or Part 3 (Exporting) — out of scope. The approved tab is the handoff point. Confirm each Phase 4 acceptance item, then declare the POC complete.
```

---

## Cross-phase reminders (true in every phase)

- **Single source of truth:** `CONTEXT_PLAN.md`. When in doubt, re-read it; never invent.
- **Domain-agnostic always:** no subject-matter assumptions anywhere in schema, logic, or copy.
- **Interfaces, not vendors:** all search goes through `SearchProvider`, all judging through `VerificationAgent`. Never call Tavily/OpenAI directly from feature code.
- **Secrets:** `process.env` only — never in the DB, never in the client bundle, never committed.
- **Budget discipline:** Tavily caps Phase 1; OpenAI (paid) scales with pages × sites in Phase 2. Respect the caps; show estimated spend.
- **State machine is law:** AI may only reach `ai_approved`/`ai_rejected`/`needs_review`; only humans reach `approved`/`rejected`; no auto-promotion; re-scan preserves history.
- **Dedup is law:** sites are unique at the site-root level; re-discovery adds discoveries, never duplicate sites, never re-spend.
- **VM-portability:** the Phase 2 worker stays a pure function of `scan_jobs` + `sources` so it can later move to an Oracle Cloud Free VM without a rewrite.
- **Design:** every screen goes through the `impeccable` skill — no default-styled UI ships.
- **Workflow every session:** `git pull origin main` → read `TASKS.md` → mark in-progress → work → commit + `git push origin main` → update `TASKS.md` → push. Never end with uncommitted work.
```
