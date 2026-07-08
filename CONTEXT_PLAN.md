# Context Plan — Advanced Web Scraper: Phase 1 "Source Searching"

> **Status:** Approved scope for the first proof-of-concept (POC) pass.
> **Audience:** Whichever development tool picks this up — **Codex or Claude Code** (used at different times, never simultaneously; a session may be resumed in either tool when the other runs out of credit).
> **This document is the single source of truth.** A developer (human or AI) picking this up cold should be able to build the feature correctly from this file alone, without re-asking the basics.

---

## 0. How to use this document

This is the **context plan** for the "Source Searching" feature — Part 1 of a three-part application. It is **not** the build prompt and **not** the code. It defines the problem, the scope, the data model, the user flows, the standing development rules, and the design methodology. Build prompts for Codex/Claude Code will be generated *from* this plan later.

Read this file top to bottom, then read `TASKS.md`, then start work.

---

## 1. Project background / problem statement

We are building an **advanced website scraper** whose purpose is to extract publicly available data from the internet **with tight, deliberate control over where the AI is allowed to look** — primarily to **save money**. Uncontrolled AI search burns budget searching places with no useful data. By governing the sources first, every later extraction is cheap and targeted.

The full application has **three parts**, built in order:

1. **Source Searching** ← *this phase* — decide *which sites* are worth extracting from.
2. **Parsing / Extraction** — pull structured data from the approved sites. *(Future phase, out of scope here.)*
3. **Exporting / Integration** — push extracted data to wherever it's needed. *(Future phase, out of scope here.)*

The whole system is operated by **AI agents**. In this phase there are **two agents**:

- **Discovery agent (Phase 1):** turns the user's keywords into search queries, runs them through the allowed search provider, and collects candidate sites.
- **Verification agent (Phase 2):** crawls each candidate site's publicly viewable pages and judges whether real, extractable data lives there.

Phase 3 is **human review** — no agent, a person makes the final call.

**This app is domain-agnostic.** It must not assume any particular subject matter. "Obituary sites" and "data cleansing blogs" were only illustrative examples during scoping — nothing in the data model, UI, or copy should hardcode any domain.

---

## 2. Scope & out-of-scope (this phase only)

### In scope
- Single-tenant internal tool behind a login (shared global data; a few trusted users).
- **Settings:** manage the Search Providers whitelist, budget/crawl configuration, and optional domain scoping.
- **Keywords:** CRUD for keyword rows + CSV import with flexible header mapping.
- **Phase 1 — Run search:** fire capped queries across active keywords via the allowed provider, dedup results to **site level**, store candidate Sources.
- **Phase 2 — Scan all sites:** chunked, VM-free crawl-and-judge with **live per-site progress**, producing AI verdicts, reasons, extractable-field detection, and a sample-data preview.
- **Phase 3 — Review:** human approve/reject queue with AI insight, evidence URLs, sample preview, bulk actions, and filters.
- **Approved (trusted) sources** view — the output that will feed the future Parsing phase.

### Out of scope (do NOT build now)
- Parsing/extraction of full datasets from approved sites (Part 2).
- Exporting / third-party integrations (Part 3).
- Multi-tenancy / per-user data isolation (single-tenant only for now).
- Multiple search engines with per-engine toggles (provider whitelist is built, but seeded with **Tavily only**).
- An always-on worker VM (explicitly deferred — see §8, Known Ceiling).
- Auto-promotion of AI-approved sites (human click is always required).
- Make.com or any external automation platform — **everything is automated inside this one web app.**

---

## 3. Architecture & stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend + API | **Next.js (App Router) + TypeScript** on **Vercel (Hobby / free)** | UI, API routes, orchestration triggers. No long-running work here. |
| Data + Auth | **Supabase** (Postgres + Auth + Realtime) | Shared global data; single login gate; Realtime streams Phase 2 progress. |
| Search provider | **Tavily** (free tier, 1,000 credits/mo, no credit card) | Behind a **swappable provider interface**. SearXNG is the documented future drop-in if the free cap is outgrown. |
| Agent LLM | **OpenAI** (user-supplied API key — **paid**, intentionally) | Behind a **swappable agent interface**. Powers the Verification agent's judgment. |
| Page fetch (Phase 2) | Plain HTTP fetch (free) with **Tavily `/extract` as fallback** for JS-heavy pages | Conserves Tavily credits. |

**Why these choices (so they aren't second-guessed):**
- Vercel can't host a persistent search engine or a long crawl worker; that's why search is an external API (Tavily) and Phase 2 is chunked, not a background daemon.
- Tavily needs no credit card and no VM, so the POC ships free for search. Its 1,000/mo cap is the real Phase-1 budget ceiling — design must be credit-thrifty.
- OpenAI is the one paid piece, accepted by the product owner, because Phase 2 quality depends on a capable model reading crawled pages.

**Provider/agent interfaces are mandatory.** Never call Tavily or OpenAI directly from feature code. Wrap each behind an interface (`SearchProvider`, `VerificationAgent`) so providers can be swapped without touching business logic.

---

## 4. Data model

Single-tenant: no `owner_id` on rows. All tables shared. Use Supabase (Postgres). Store timestamps in UTC.

### 4.1 `search_providers` (the whitelist — the hard scope boundary)
The **enabled providers are the hard boundary on where searches may go.** A search run may only use providers that are `enabled = true`. This is enforcement, not a suggestion — the run builder must reject/skip any disabled provider.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | e.g. "Tavily". Seeded with Tavily only. |
| `enabled` | boolean | Hard on/off. Disabled → cannot be used by any run. |
| `api_key_env` | text | **Name** of the env var holding the key (e.g. `TAVILY_API_KEY`). Never the key itself. |
| `default_result_cap` | int | Max results requested per query (configurable; default e.g. 10). |
| `config` | jsonb | Provider-specific params. |
| `created_at` / `updated_at` | timestamptz | |

### 4.2 `app_settings` (global config, single row)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Single-row table. |
| `include_domains` | text[] | **Optional** domain scoping. When non-empty, searches are restricted to only these sites ("only search within these sites"). When empty, open-web search. Global for the POC (per-run override is a future enhancement). |
| `result_cap_per_query` | int | Default top-N results kept per query. |
| `crawl_max_pages` | int | Phase 2: max public pages crawled per site (e.g. 15–25). |
| `crawl_max_depth` | int | Phase 2: link-follow depth (e.g. 1–2). |
| `crawl_char_budget` | int | Max characters/tokens per site before summarizing to OpenAI. |
| `chunk_size` | int | Phase 2: sites processed per serverless invocation. |
| `updated_at` | timestamptz | |

### 4.3 `keywords` (topics / locations list — one row = one query)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `topic` | text NOT NULL | The subject to search for (domain-neutral). Required. |
| `location` | text NULL | Optional location qualifier. |
| `notes` | text NULL | Free-text intent/notes. |
| `active` | boolean DEFAULT true | Only `active` rows are used by a run. |
| `created_at` / `updated_at` | timestamptz | |

- **One row = one query.** The query is `topic` + `location` (if present). **No auto cross-product / no location expansion** in the POC (it silently multiplies credit spend). Dedup key for CSV import: lowercased+trimmed `(topic, location)`.

### 4.4 `search_runs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `status` | enum | `queued` \| `running` \| `done` \| `partial` \| `failed`. `partial` = stopped on credit limit. |
| `started_at` / `finished_at` | timestamptz | |
| `query_count` | int | Queries fired. |
| `result_count` | int | New candidate sites created. |
| `credits_spent_est` | int | Estimated Tavily credits used. |
| `keywords_snapshot` | jsonb | Which keywords/queries this run used (immutable snapshot). |
| `providers_snapshot` | jsonb | Which enabled providers were used. |

### 4.5 `sources` (candidate → trusted sites; deduped at SITE level)
One row **per site**, identified/displayed by its **site root** (e.g. `https://obitmanila.com`), never the deep page URL.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `site_url` | text UNIQUE | Site root; the display + dedup identity. |
| `domain` | text | Normalized domain. |
| `title` | text | From first discovery. |
| `snippet` | text | From first discovery. |
| `status` | enum | `pending` \| `scanning` \| `ai_approved` \| `ai_rejected` \| `needs_review` \| `approved` \| `rejected`. See §6 state machine. |
| `ai_verdict` | enum NULL | `approve` \| `reject` \| `needs_review`. |
| `ai_confidence` | numeric NULL | 0–1. |
| `ai_reason` | text NULL | Plain-language "why it qualifies / doesn't" insight. |
| `extractable_fields` | text[] NULL | Data types the agent detected (domain-neutral chips). |
| `sample_preview` | jsonb NULL | Small sample of the data the agent believes it can extract. |
| `evidence_urls` | text[] NULL | The specific public pages the agent crawled to decide. |
| `scan_step` | text NULL | Live sub-status for progress UI (e.g. "crawling 3/15", "judging"). |
| `human_note` | text NULL | Reviewer note from Phase 3. |
| `first_discovered_at` / `last_scanned_at` | timestamptz | |

### 4.6 `source_discoveries` (many-to-many: which keyword/run found which site)
A site found by multiple keywords/runs gets **one** `sources` row plus multiple discovery rows — never a duplicate site, never re-spend on re-discovery.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `source_id` | uuid FK → sources | |
| `keyword_id` | uuid FK → keywords | |
| `run_id` | uuid FK → search_runs | |
| `discovered_at` | timestamptz | |

### 4.7 `scan_jobs` (drives chunked Phase 2 + Realtime progress)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `status` | enum | `queued` \| `running` \| `paused` \| `done` \| `failed`. |
| `total_sites` / `processed_sites` | int | For the progress bar. |
| `current_source_id` | uuid NULL | What's being scanned right now. |
| `started_at` / `updated_at` | timestamptz | |

> **"Trusted sources" = every `sources` row with `status = 'approved'`.** This is the deliverable that feeds the future Parsing phase. Expose it as a saved filter/tab within the Review page (see §5 IA amendment) for the POC.

---

## 5. User flows (POC done-criteria)

The phase is **done** when a user can do all of this end to end:

1. **Log in** (Supabase Auth — single shared login gate; the app is not public).
2. **Settings** — manage the Search Providers whitelist (Tavily enabled, key referenced via env), set `result_cap_per_query` and crawl bounds, set optional `include_domains`.
3. **Keywords** — add/edit/delete keyword rows (`topic`/`location`/`notes`/`active`) and **CSV import** (see §7) with header mapping + summary.
4. **Run search (Phase 1)** — on the **Search** page, pick which specific active keyword(s) to include (default: all selected, with select-all/none), fire one capped query per selected keyword through enabled providers, dedup to site-level `sources`, and show a run summary (queries fired, new sites, estimated credits). Stops gracefully as `partial` if the Tavily cap is hit.
5. **Scan all sites (Phase 2)** — on the **Scan** page, one **"Scan all sites"** action runs a chunked crawl-and-judge over `pending` sites with a **live loading state** showing which site is being scanned and its current step (fetching → crawling page X/N → judging → verdict), streamed via Supabase Realtime. Produces `ai_verdict` + `ai_reason` + `extractable_fields` + `sample_preview` + `evidence_urls`.
6. **Review (Phase 3)** — on the **Review** page, a queue (default filter: `ai_approved` + `needs_review`) where each site shows: site URL (opens new tab), AI verdict + confidence, AI reason, extractable-field chips, **sample-data preview**, **evidence URLs**, and the keyword/run that found it. Actions: **Approve / Reject / Re-scan / note**, plus **bulk approve/reject** and filters (status/keyword/run/confidence). Human click always required; AI never auto-promotes.
7. **Approved (trusted) sources** — a saved filter/tab within the Review page.

**Information architecture (navigation):** **Dashboard** (counts + recent runs) · **Keywords** · **Search** (Phase-1 run-search, keyword-scoped) · **Scan** (Phase-2 scan-all-sites trigger + live progress) · **Review** (Phase-3 human review, incl. the Approved tab) · **Settings** (providers, budget/crawl config, auth).

> Amended from the original single-page "Sources" IA: the product owner explicitly requested Search, Scan, and Review be three separate pages/steps (routes `/sources/search`, `/sources/scan`, `/sources/review`; `/sources` redirects to `/sources/search`) instead of tabs on one table. Each still writes to the same `sources` table and state machine in §6 — this is a navigation change only, not a data-model change.

---

## 6. Source status state machine

```
pending ──scan──▶ scanning ──▶ ai_approved ─┐
                      │                       ├─human─▶ approved
                      ├──▶ ai_rejected  ──────┤
                      └──▶ needs_review ──────┴─human─▶ rejected
```

Rules:
- The **Verification agent** may only move a source among `pending → scanning → {ai_approved | ai_rejected | needs_review}`.
- Only a **human** may set the terminal states `approved` / `rejected`.
- AI states and human states are **separate** — you can always see "AI said yes, human hasn't confirmed."
- A human may **override** any AI verdict.
- **Re-scan** is allowed: resets to `scanning`, updates the verdict, preserves history.
- **No auto-promotion.** `ai_approved` never becomes `approved` without a human click (bulk approve exists to make it fast).

---

## 7. CSV import behavior (keywords)

- **Flexible header mapping:** user uploads any CSV; the app detects columns and lets the user **map each column to a field** (`topic`, `location`, `notes`, `active`), auto-detecting common header names with manual override. A downloadable template is offered.
- **Append + dedup by default;** "replace all" is an explicit, confirmed action. **Never silently wipe** the list.
- **Dedup** on lowercased/trimmed `(topic, location)`. Existing match → **skip and report** (do not overwrite existing `notes`/`active`).
- **Per-row validation:** import the good rows, reject bad ones, and show a **summary** ("142 added, 8 skipped as duplicates, 3 rejected — row 5: empty topic…"). A few bad rows never fail the whole file.
- **`active`** defaults to `true` when blank. **`topic`** is the only required field.
- **Row cap** (e.g. 5,000) so a giant upload can't blow up a serverless function.

---

## 8. Known ceilings & risks (build with these in mind)

These are **documented boundaries, not bugs.** Do not over-engineer around them; do not pretend they don't exist.

1. **Verification is inherently fuzzy.** AI verdicts are *suggestions*; Phase 3 human review is where quality comes from. Never treat `ai_approved` as ground truth.
2. **Chunked serverless is the first thing that breaks under scale.** Phase 2 runs while the user's tab is open (browser-driven chunk loop); closing the tab **pauses** the batch. A **Resume** action re-processes remaining `pending`/`scanning` sites idempotently. Fine for POC-sized lists; **the clean upgrade path is an Oracle Cloud Free worker VM** — design the Phase 2 worker so it can later move to a VM without a rewrite (keep it a pure function over `scan_jobs` + `sources`).
3. **Two budget ceilings in tension.** Tavily 1,000/mo caps Phase 1; OpenAI (paid) cost scales with pages × sites in Phase 2. `result_cap_per_query` and crawl bounds are the throttles. Always show estimated spend.
4. **Anti-bot / JS / paywalls** will make a real slice of sites unreadable → `needs_review` with reason. Expected, not a defect. Respect `robots.txt` (skip disallowed sites as `needs_review`, never crawl anyway).
5. **Legal/ToS gray area.** Respect robots.txt now; keep the model able to add provenance/PII/consent tracking later without a rewrite.
6. **Vercel Hobby limits** (function timeouts, cron granularity, non-commercial terms) constrain Phase 2 and may force a paid plan if this becomes a real business tool.

### Edge-case handling (required)
- **Credit exhaustion mid-run** → stop gracefully, run = `partial`, show "X of Y done, credit limit reached."
- **Site found by multiple keywords** → one `sources` row + multiple `source_discoveries`; no re-spend.
- **robots.txt disallow** → `needs_review`, reason "crawling disallowed."
- **Dead/timeout site** → retry a couple times → `needs_review` with error; never block the batch.
- **JS-heavy empty fetch** → fall back to Tavily `/extract`; still empty → `needs_review`.
- **OpenAI failure/rate limit** → retry w/ backoff; repeated failure → leave `pending` (NOT falsely rejected) so re-scan can retry.
- **Tab closed during scan** → batch pauses; **Resume** picks up remaining sites idempotently.
- **Re-running same keywords** → reuse existing sources via dedup; only new sites added; no duplicate spend.
- **Malformed/huge CSV** → validate, import good rows, report rejects, enforce row cap.
- **Secrets** → Tavily + OpenAI keys in `process.env` only; never in DB, never in client bundles.

---

## 9. Standing development workflow rules (VERBATIM — applies to BOTH Codex and Claude Code)

> These rules are non-negotiable and apply to **every** session in **either** tool. A session may be resumed in Codex or Claude Code depending on which has credit — so state must always live in git + `TASKS.md`, never only in a tool's memory.

1. **ALWAYS start by running:** `git pull origin main`
2. **ALWAYS read `TASKS.md`** before writing any code.
3. **ALWAYS update `TASKS.md` at the start of a task** (mark in-progress + describe intent).
4. **ALWAYS commit after completing each change request** — `git add`, `git commit`, and `git push origin main`.
5. **ALWAYS update `TASKS.md` at the end of a task** (mark done + point to next task) and push.
6. **NEVER leave uncommitted work when ending a session.**
7. **NEVER hardcode API keys, secrets, or credentials. Use `process.env` only.**

---

## 10. Design methodology — use the `impeccable` skill (MANDATORY)

**All UI/UX work on this project must go through the `impeccable` skill — not default styling.** This admin UI must not come out looking generic/AI-default.

- **First, run `impeccable teach`** once to establish the project's design context (tokens, type, color, layout system) before building any screens.
- **Then, for each screen/feature, run `impeccable craft [feature]`** — use its shape-then-build flow rather than hand-rolling styles.
- Use `impeccable extract` to pull shared components/tokens as the UI grows so the six areas (Dashboard/Keywords/Search/Scan/Review/Settings) stay consistent.
- Do **not** ship default-styled components. If a quick prototype is styled plainly, it must be passed through `impeccable` before it's considered done.

---

## 11. What a developer needs before starting

- **Env vars** (in `.env.local` / Vercel project settings, never committed): `TAVILY_API_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. See `.env.example`.
- **Accounts to create:** Supabase project, Tavily account (free, no card), OpenAI key (paid), Vercel project connected to the GitHub repo, GitHub repo on `main`.
- **Task 0 (first task):** scaffold the repo — Next.js App Router + TypeScript, Supabase client wiring, Tavily + OpenAI provider interfaces (stubbed), the DB schema from §4 as a Supabase migration, Supabase Auth login gate, and `TASKS.md`. Then run `impeccable teach`.

---

## 12. Glossary (shared vocabulary — use these exact terms)

- **Search Provider / Whitelist** — the governed list of allowed search backends; **enabled providers are the hard boundary** on where searches go. Seeded with Tavily only.
- **Keyword** — one row (`topic` + optional `location`) = one search query. No auto-expansion.
- **Search Run** — one execution of active keywords against enabled providers; produces candidate sources.
- **Source** — one **site** (site-root URL), deduped at site level, moving through the §6 state machine.
- **Candidate source** — a `pending`/`scanning`/`ai_*`/`needs_review` source (not yet human-decided).
- **Trusted / Approved source** — a source with `status = 'approved'`; the deliverable feeding Part 2 (Parsing).
- **Discovery agent** — Phase 1 (query → search → dedup).
- **Verification agent** — Phase 2 (crawl public pages → judge).
- **Phase 3** — human review; final approve/reject. No agent.
