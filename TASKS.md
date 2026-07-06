# TASKS.md — Source Searching (Phase 1)

> **Read this before writing any code.** Follow the standing dev workflow rules in `CONTEXT_PLAN.md` §9.
> Applies to **both Codex and Claude Code** — a session may be resumed in either tool. State lives in git + this file, never only in a tool's memory.
>
> Workflow per task: `git pull origin main` → read this file → mark task **in-progress** (with intent) → do the work → **commit + push** → mark task **done** + point to next → push. Never end a session with uncommitted work. Secrets via `process.env` only. All UI goes through the `impeccable` skill.

## Legend
`[ ]` not started · `[~]` in progress · `[x]` done

---

## Milestone 0 — Foundation
- [~] **T0.1** Scaffold Next.js (App Router) + TypeScript; connect GitHub repo + Vercel auto-deploy. Intent: build the Phase 0 foundation only, including typed stubs, Supabase auth/client wiring, schema migration, empty routed pages, and an impeccable design baseline without Phase 1 feature behavior.
- [ ] **T0.2** Add Supabase project; wire client + service-role clients; add `.env.example`.
- [ ] **T0.3** Create DB migration for all tables in CONTEXT_PLAN §4.
- [ ] **T0.4** Supabase Auth single-login gate (app not public).
- [ ] **T0.5** Stub `SearchProvider` (Tavily) + `VerificationAgent` (OpenAI) interfaces.
- [ ] **T0.6** Run `impeccable teach` to establish design tokens/system. **Do not skip.**

## Milestone 1 — Settings & lists
- [ ] **T1.1** Settings: Search Providers whitelist CRUD (enable/disable; key via env ref).
- [ ] **T1.2** Settings: budget/crawl config + optional `include_domains`.
- [ ] **T1.3** Keywords CRUD (topic/location/notes/active).
- [ ] **T1.4** CSV import with flexible header mapping + append/dedup + summary (CONTEXT_PLAN §7).

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
