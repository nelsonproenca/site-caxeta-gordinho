-- matches.tiktok_account_id is denormalized (see 20260715000010) purely to
-- keep RLS a single check instead of a join — but that also means an admin
-- with access to account A satisfies matches_write_admin's RLS check while
-- setting tiktok_account_id = A and live_session_id pointing at a *different*
-- account's live session (RLS only validates the column value on the row
-- being written, never that it agrees with live_session_id's real account).
-- Close that gap: a match's tiktok_account_id must always match the account
-- of the live_session it belongs to.
create or replace function public.matches_validate_account()
returns trigger
language plpgsql
as $$
declare
  v_session_account uuid;
begin
  select tiktok_account_id into v_session_account
  from public.live_sessions
  where id = new.live_session_id;

  if v_session_account is null or v_session_account <> new.tiktok_account_id then
    raise exception 'matches.tiktok_account_id must match live_sessions.tiktok_account_id for live_session_id %', new.live_session_id;
  end if;

  return new;
end;
$$;

create trigger matches_check_account_matches_session
  before insert or update of tiktok_account_id, live_session_id on public.matches
  for each row execute function public.matches_validate_account();
