-- points_awarded is a snapshot of scoring_rules.points at write time — never
-- recompute historical totals from the current scoring_rules row, since
-- admins can retune point values later (prd.md §4.3, CLAUDE.md).
--
-- scoring_rule_id intentionally has NO "on delete cascade": a scoring_rule
-- with historical match_results must not be deletable at all (the app only
-- ever toggles is_active, never deletes a scoring_rule — see toggleScoringRule
-- in lib/actions/scoring-rules.ts). Don't add cascade here "to fix" a delete
-- failing on this FK — that would silently destroy historical ranking data,
-- exactly what points_awarded snapshotting exists to prevent. Delete
-- match_results explicitly first if a full account teardown is ever needed
-- (see scripts/smoke-test.ts cleanup()).
create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  scoring_rule_id uuid not null references public.scoring_rules (id),
  points_awarded integer not null,
  recorded_by uuid not null references public.admins (id),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

alter table public.match_results enable row level security;

create policy "match_results_select_public"
  on public.match_results
  for select
  using (true);

create policy "match_results_write_admin"
  on public.match_results
  for all
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_results.match_id
        and public.has_account_access(m.tiktok_account_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_results.match_id
        and public.has_account_access(m.tiktok_account_id)
    )
  );
