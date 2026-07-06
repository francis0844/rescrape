# TASKS.md — Source Searching (Phase 1)

> **Read this before writing any code.** Follow the standing dev workflow rules in `CONTEXT_PLAN.md` §9.
> Applies to **both Codex and Claude Code** — a session may be resumed in either tool. State lives in git + this file, never only in a tool's memory.
>
> Workflow per task: `git pull origin main` → read this file → mark task **in-progress** (with intent) → do the work → **commit + push** → mark task **done** + point to next → push. Never end a session with uncommitted work. Secrets via `process.env` only. All UI goes through the `impeccable` skill.

## Legend
`[ ]` not started · `[~]` in progress · `[x]` done

---

## Milestone 0 — Foundation
- [x] **T0.1** Scaffold Next.js (App Router) + TypeScript; connect GitHub repo + Vercel auto-deploy. GitHub remote is on `main`; Vercel auto-deploy steps documented in `README.md` because dashboard access is not available in this session.
- [x] **T0.2** Add Supabase project; wire client + service-role clients; add `.env.example`.
- [x] **T0.3** Create DB migration for all tables in CONTEXT_PLAN §4.
- [x] **T0.4** Supabase Auth single-login gate (app not public).
- [x] **T0.5** Stub `SearchProvider` (Tavily) + `VerificationAgent` (OpenAI) interfaces.
- [x] **T0.6** Run `impeccable teach` to establish design tokens/system. **Do not skip.**

## Milestone 1 — Settings & lists
- [x] **T1.1** Settings: Search Providers whitelist CRUD (enable/disable; key via env ref).
- [x] **T1.2** Settings: budget/crawl config + optional `include_domains`.
- [x] **T1.3** Keywords CRUD (topic/location/notes/active).
- [x] **T1.4** CSV import with flexible header mapping + append/dedup + summary (CONTEXT_PLAN §7).

## Milestone 2 — Phase 1 (Discovery)
- [ ] **T2.1** Run-search: build queries from active keywords, enforce enabled-providers boundary.
- [ ] **T2.2** Tavily call w/ result cap; site-level dedup; write sources + source_discoveries.
- [ ] **T2.3** Run summary (queries, new sites, est. credits); graceful `partial` on credit limit.

## Milestone 3 — Phase 2 (Verification)
- [ ] **T3.1** "Scan all sites": scan_jobs + chunked serverless loop (browser-driven) + Resume.
- [ ] **T3.2** Bounded crawler (robots.txt, depth/page/char caps; Tavily /extract fallback).
- [ ] **T3.3** OpenAI judge → verdict/confidence/reason/extractable_fields/sample_preview/evidence_urls.
- [ ] **T3.4** Live progress via Supabase Realtime (current site + scan_step).

## Milestone 4 — Phase 3 (Review) + delivery
- [ ] **T4.1** Review queue: cards w/ AI insight, evidence URLs, sample preview, filters.
- [ ] **T4.2** Approve/Reject/Re-scan/note + bulk actions (human-only terminal states).
- [ ] **T4.3** Approved (trusted) sources saved filter/tab on Sources.
- [ ] **T4.4** Dashboard (counts + recent runs).
- [ ] **T4.5** End-to-end POC pass against CONTEXT_PLAN §5 done-criteria; `impeccable` polish.

---

## Session log
- _(each session: append date, tool used (Codex/Claude Code), what changed, next task)_
- 2026-07-07, Codex: completed Milestone 0 foundation. Added Next.js App Router + TypeScript scaffold, exact `.env.example`, Supabase browser/server/service-role clients, single SQL migration with required tables/enums/seeds, Supabase Auth gate, typed provider/agent stubs with no real API calls, empty Dashboard/Keywords/Sources/Settings routes, and `impeccable teach` PRODUCT/DESIGN baseline. Verified `npm run build`, `npm run dev`, service-role env did not appear in checked build bundles, and no subject-specific terms were introduced. Next task: T1.1 Settings search provider whitelist CRUD.
- 2026-07-07, Codex: completed Milestone 1 Settings & lists. Added Settings provider whitelist controls for the seeded provider row, global budget/crawl settings including include_domains, keyword create/edit/delete/toggle forms, and CSV import with header detection, manual mapping, template download, append-by-default dedup, explicit replace confirmation, row validation, row cap, and import summary. Verified `npm run build`, unauthenticated Settings/Keywords redirects, no service-role marker in client static assets, and no direct Tavily/OpenAI calls. Next task: T2.1 run-search builder with enabled-provider enforcement.
