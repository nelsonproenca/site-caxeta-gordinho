-- prd.md §4.3: "Fechar uma sessão de live não bloqueia edição retroativa por
-- admin (correção de lançamento incorreto), mas fica registrado log de
-- alteração (auditoria simples: quem alterou, quando, valor anterior)." This
-- table is that log — written by lib/actions/lives.ts's updateMatchResult
-- and deleteMatchResult, never read by the app yet (no viewer UI), but kept
-- so "who changed this score and what was it before" is answerable later
-- without having to add it retroactively.
--
-- match_result_id intentionally has NO "on delete cascade" the other
-- direction (matches -> match_results already cascades on the way in, see
-- 20260715000011) — a 'delete' log row needs to survive the match_result it
-- describes being deleted, so this uses "on delete set null" instead: the
-- row (and its snapshot of what the value used to be) stays, only the
-- now-dangling reference is cleared.
create table public.match_result_edits (
  id uuid primary key default gen_random_uuid(),
  match_result_id uuid references public.match_results (id) on delete set null,
  action text not null check (action in ('update', 'delete')),
  previous_scoring_rule_id uuid references public.scoring_rules (id),
  previous_points_awarded integer not null,
  new_scoring_rule_id uuid references public.scoring_rules (id),
  new_points_awarded integer,
  edited_by uuid not null references public.admins (id),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.match_result_edits enable row level security;

-- Same visibility/write rule as match_results itself: admins with access to
-- the account. No public select — this is an internal accountability log,
-- not ranking data.
create policy "match_result_edits_admin"
  on public.match_result_edits
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));

-- tiktok_account_id is denormalized here on purpose (unlike matches/
-- caxetao_events, it can't just be derived via a join at read time — a
-- 'delete' row's match_result_id goes null once the match_result it
-- describes is gone, which would silently orphan the row from RLS if access
-- were join-based instead). Same spoofing risk as any denormalized
-- account-id column though (see matches_validate_account,
-- 20260717000014): validate it agrees with the real match_result's account
-- at insert time, while that reference still exists to check against.
create or replace function public.match_result_edits_validate_account()
returns trigger
language plpgsql
as $$
declare
  v_result_account uuid;
begin
  if new.match_result_id is null then
    return new;
  end if;

  select m.tiktok_account_id into v_result_account
  from public.match_results mr
  join public.matches m on m.id = mr.match_id
  where mr.id = new.match_result_id;

  if v_result_account is null or v_result_account <> new.tiktok_account_id then
    raise exception 'match_result_edits.tiktok_account_id must match the referenced match_result''s account';
  end if;

  return new;
end;
$$;

create trigger match_result_edits_check_account
  before insert on public.match_result_edits
  for each row execute function public.match_result_edits_validate_account();
