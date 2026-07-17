-- score_periods becomes admin-driven open/close lifecycle instead of a
-- pre-dated range: ends_at is only known once a period is actually closed,
-- and at most one period per account can be open at a time (enforced below)
-- so ranking accumulation always has an unambiguous "current" period.
alter table public.score_periods
  alter column ends_at drop not null,
  add column status text not null default 'open' check (status in ('open', 'closed'));

create unique index score_periods_one_open_per_account
  on public.score_periods (tiktok_account_id)
  where status = 'open';

-- Denormalized like matches.tiktok_account_id (see CLAUDE.md) — assigned when
-- a live is opened, from whichever score_period is open for the account at
-- that moment, so a period's ranking is a simple join instead of a
-- date-range comparison that could drift if period dates are edited later.
alter table public.live_sessions
  add column score_period_id uuid references public.score_periods (id);

alter table public.matches
  add column score_period_id uuid references public.score_periods (id);

-- Copies the live session's score_period_id onto every match created inside
-- it, so ranking queries only ever need a single-level join on `matches`
-- (mirrors the tiktok_account_id denormalization already done on this table).
create or replace function public.matches_set_score_period()
returns trigger
language plpgsql
as $$
begin
  select score_period_id into new.score_period_id
  from public.live_sessions
  where id = new.live_session_id;
  return new;
end;
$$;

create trigger matches_copy_score_period
  before insert on public.matches
  for each row execute function public.matches_set_score_period();
