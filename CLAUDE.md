# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Scaffolded with `create-next-app` (Next.js 16, React 19, App Router, TypeScript, Tailwind v4, npm). There is no `src/` directory — routes live directly under `app/`.

- `prd.md` — the full product/technical requirements document. **Read this first** before writing any code; it is the source of truth for data model, business rules, and architecture decisions.
- `assets/ferrari-design-system.html` — a standalone, self-contained HTML/CSS design system (colors, typography, buttons, cards, badges, forms, standings table, charts) that defines the visual language the site should adopt. It's a plain static file (not a `.pen` file) — read it directly with the Read tool for exact CSS custom properties, class names, and component markup before building UI. `prd.md` §9 maps each of its components to a caxeta-specific use (e.g. `.card-driver` → player ranking card, `.card-race` → match/round card). Its `:root` tokens and components are ported into `app/globals.css` (Tailwind v4 `@theme inline`) — see that file for the actual utilities in use (`bg-red`, `font-display`, etc.) rather than re-deriving them from the static asset each time.
- The phased engineering plan (scaffolding order, RLS matrix, per-phase milestones M0–M5) lives at `C:\Users\nelso\.claude\plans\elabore-um-plano-de-dazzling-parrot.md` — consult it for what's already decided (e.g. `matches.tiktok_account_id` denormalization, `admins.id = auth.users.id`, championship scoring isolated from the regular ranking) before re-deciding architecture.

## Commands

- `npm run dev` — start the dev server.
- `npm run build` — production build.
- `npm run start` — run the production build.
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`).
- `supabase db push` — apply pending `supabase/migrations/*.sql` to the linked remote project (no local Docker/Postgres in this environment — there is no `supabase start` workflow here, migrations are written and pushed directly to the real linked project).
- `supabase gen types typescript --linked > lib/supabase/database.types.ts` — regenerate types after any migration; the Supabase clients in `lib/supabase/{client,server,service}.ts` are all typed with `Database` from this file, so a schema change without regenerating will silently type-check against a stale schema.
- `node --env-file=.env.local --import tsx scripts/smoke-test.ts` — exercises the Fase 1 data flow (account creation, scoring, live session, match results, ranking math) and RLS cross-tenant/anon isolation directly against the real linked project, then cleans up after itself. Not a substitute for the Vitest RLS suite the plan calls for before Fase 2 — run this after any RLS policy or scoring-math change in the meantime.

No test runner is configured yet.

## What this project is

A platform to manage a TikTok creator's live "Caxeta" (card game) streams: manual scoring of matches per live session, weekly/season rankings, a Saturday "Caxetão" event with configurable registration (principal/substitute slots, closing by time or by count), World-Cup-style championships (groups → knockout), and multi-account management (one platform, several managed TikTok accounts, admins/moderators scoped per account).

Full domain rules, entities, and the proposed Postgres schema are in `prd.md` §4–§7 — do not re-derive these from scratch, reference them.

## Key architectural constraints (non-obvious, drives everything)

- **No TikTok API access for live/follower data.** There is no official API to read live-room participants or a creator's follower list. All match results are entered manually by an admin/moderator through the panel during/after the live. "Active/most engaged followers" are computed from in-platform activity (matches played, live participations, Caxetão/championship participation) — never fetched from TikTok. See `prd.md` §1.1.
- **Players are global, participation is per-account.** A `players` row is one person across the whole platform; their scores, live participations, Caxetão registrations, and championship history are always scoped to a `tiktok_account_id`. Any query/feature touching scores or rankings must filter by the active managed account.
- **Players have no password-based auth** (lightweight signup: display name + unique TikTok handle, optional WhatsApp). Only admins/moderators authenticate (Supabase Auth). Don't build a full auth flow for players in the MVP.
- **Scoring rules are per-account and admin-configurable**, not hardcoded constants — points for each result type (e.g. "vitória lambreta", "derrota normal") live in a `scoring_rules` table and are editable without a code change. `match_results.points_awarded` is a snapshot at write time, so historical totals must never be recalculated from current `scoring_rules` values.
- **Multi-tenancy by TikTok account**: an admin can own/moderate several `tiktok_accounts`; access is governed by `admin_account_access` (role: owner/moderator per account). Authorization (Supabase RLS) should key off this join table, not off a single global admin role.

## Stack

Next.js 16 (App Router, TypeScript) + Supabase (Postgres + Auth + RLS) + Tailwind v4, deployed on Vercel. Public ranking/bracket pages should be public reads (no login); all writes (lives, match results, Caxetão, championships) are admin/moderator-only and scoped by managed account. See `prd.md` §8.1 for the suggested folder layout and §8.2 for required environment variables.

This project is intentionally independent of other repos on this machine (e.g. `BusinessOS`) — don't port conventions from there; follow `prd.md` and `assets/ferrari-design-system.html` instead.

Root file is `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). `AGENTS.md` above is a real warning: this Next.js version has changes past most training data: check `node_modules/next/dist/docs/` before assuming an API/convention from memory.

## Fase 1 (MVP) — implemented

Migrations `supabase/migrations/2026071500000{1..11}_*.sql` create `admins` (1:1 with `auth.users`), `tiktok_accounts`, `admin_account_access`, `players`, `scoring_rules`, `score_periods`, `live_sessions`, `live_participants`, `matches` (with `tiktok_account_id` denormalized — deliberate deviation from prd.md §7 to keep every write policy a single `has_account_access()` check instead of a join), and `match_results`. Two SECURITY DEFINER helper functions (`has_account_access`, `is_account_owner`) back nearly every RLS policy — reuse them rather than re-writing the `admin_account_access` exists-subquery. Accounts are created exclusively through the `create_tiktok_account` RPC (also seeds the 4 default `scoring_rules`), because `tiktok_accounts` has no direct insert policy — the first `admin_account_access` row for a new account can't otherwise satisfy `is_account_owner()`.

`players` has no insert/update policy for anon or authenticated at all — both public self-registration and admin "quick add" during a live go through Server Actions using `lib/supabase/service.ts` (service-role, bypasses RLS), so handle normalization/dedupe lives in one place. Every other admin-facing write goes through the regular per-request client (`lib/supabase/server.ts`) and relies on RLS, not application-level role checks.

Admin routes live under `app/admin/(shell)/` (route group, doesn't affect the URL) so `app/admin/login` can render without the sidenav shell that the rest of `/admin/**` gets from `app/admin/(shell)/layout.tsx`. `proxy.ts` redirects unauthenticated requests to `/admin/login` for anything under `/admin` except that route.

`lib/scoring/get-ranking.ts` is the single source of truth for ranking math (points desc → count of positive-point results desc → handle alphabetical). The exact "vitórias lambreta"-specific tie-break from prd.md §12 is still an open decision (scoring_rules has no category column to distinguish a lambreta win from a normal one) — don't invent a category column without checking that decision first.
