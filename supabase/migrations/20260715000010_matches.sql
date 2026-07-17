-- tiktok_account_id is denormalized here (also derivable via live_session_id
-- -> live_sessions.tiktok_account_id) so every write policy on matches and
-- match_results is a single direct has_account_access() check instead of a
-- 2-3 level join. See the engineering plan, M1.
--
-- live_session_id is NOT NULL for now because Fase 1 only has live-session
-- matches. Fase 2 (Caxetão) and Fase 3 (championships) migrations will:
--   alter table matches alter column live_session_id drop not null;
--   alter table matches add column caxetao_event_id uuid references caxetao_events(id);
--   alter table matches add column championship_match_id uuid references championship_matches(id);
--   alter table matches add constraint matches_exactly_one_source check (...);
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  live_session_id uuid not null references public.live_sessions (id) on delete cascade,
  played_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "matches_select_public"
  on public.matches
  for select
  using (true);

create policy "matches_write_admin"
  on public.matches
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));
