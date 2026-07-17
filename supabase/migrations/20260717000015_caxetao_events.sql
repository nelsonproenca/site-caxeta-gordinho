-- Caxetão: a special Saturday event requiring advance registration, closed
-- either by a deadline, by reaching max_principals, or by whichever happens
-- first (close_rule). Registration state machine and substitute-queue
-- promotion live in application code (Server Actions, Fase 2 next steps) —
-- this migration only encodes the schema and the constraints cheap enough to
-- enforce at the DB level (prd.md §4.5, §7).
create table public.caxetao_events (
  id uuid primary key default gen_random_uuid(),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  event_date date not null,
  registration_opens_at timestamptz not null,
  registration_closes_at timestamptz,
  max_principals integer,
  max_substitutes integer,
  close_rule text not null check (close_rule in ('time', 'count', 'both')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'registrations_open', 'registrations_closed', 'in_progress', 'finished')),
  created_by uuid not null references public.admins (id),
  created_at timestamptz not null default now(),
  constraint caxetao_events_closes_at_required_for_time
    check (close_rule = 'count' or registration_closes_at is not null),
  constraint caxetao_events_max_principals_required_for_count
    check (close_rule = 'time' or max_principals is not null),
  constraint caxetao_events_max_principals_positive
    check (max_principals is null or max_principals > 0),
  constraint caxetao_events_max_substitutes_non_negative
    check (max_substitutes is null or max_substitutes >= 0),
  constraint caxetao_events_closes_after_opens
    check (registration_closes_at is null or registration_closes_at > registration_opens_at)
);

alter table public.caxetao_events enable row level security;

create policy "caxetao_events_select_public"
  on public.caxetao_events
  for select
  using (true);

create policy "caxetao_events_write_admin"
  on public.caxetao_events
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));
