-- Extends matches to allow a Caxetão event as the source of a match instead
-- of a live_session, per the plan already noted in 20260715000010. Exactly
-- one source must be set per row (championship_match_id will join this
-- constraint when Fase 3 adds championship_matches).
alter table public.matches
  alter column live_session_id drop not null,
  add column caxetao_event_id uuid references public.caxetao_events (id);

alter table public.matches
  add constraint matches_exactly_one_source
  check (
    (live_session_id is not null)::int
    + (caxetao_event_id is not null)::int
    = 1
  );

-- matches_validate_account (20260717000014) only checked the live_session
-- path. Extend it to also validate a caxetao_event source; tiktok_account_id
-- must still agree with whichever source is set.
create or replace function public.matches_validate_account()
returns trigger
language plpgsql
as $$
declare
  v_source_account uuid;
begin
  if new.live_session_id is not null then
    select tiktok_account_id into v_source_account
    from public.live_sessions
    where id = new.live_session_id;
  else
    select tiktok_account_id into v_source_account
    from public.caxetao_events
    where id = new.caxetao_event_id;
  end if;

  if v_source_account is null or v_source_account <> new.tiktok_account_id then
    raise exception 'matches.tiktok_account_id must match the source (live_session or caxetao_event) account for match %', new.id;
  end if;

  return new;
end;
$$;

-- Column list needs caxetao_event_id added so the trigger also re-validates
-- when that column changes on UPDATE (INSERT always fires regardless of the
-- OF list, but UPDATE is filtered by it).
drop trigger if exists matches_check_account_matches_session on public.matches;

create trigger matches_check_account_matches_source
  before insert or update of tiktok_account_id, live_session_id, caxetao_event_id on public.matches
  for each row execute function public.matches_validate_account();

-- matches_set_score_period (20260717000013) unconditionally looked up
-- score_period_id from live_sessions, which would silently null it out for
-- Caxetão matches (no matching row). Caxetão is a separate event, not part
-- of the weekly/season ranking — its matches simply have no score_period_id.
create or replace function public.matches_set_score_period()
returns trigger
language plpgsql
as $$
begin
  if new.live_session_id is not null then
    select score_period_id into new.score_period_id
    from public.live_sessions
    where id = new.live_session_id;
  end if;
  return new;
end;
$$;
