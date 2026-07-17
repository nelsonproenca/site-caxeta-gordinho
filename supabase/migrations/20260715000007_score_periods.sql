create table public.score_periods (
  id uuid primary key default gen_random_uuid(),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  type text not null check (type in ('week', 'season')),
  label text not null,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now(),
  constraint score_periods_valid_range check (ends_at >= starts_at)
);

alter table public.score_periods enable row level security;

create policy "score_periods_select_public"
  on public.score_periods
  for select
  using (true);

create policy "score_periods_write_admin"
  on public.score_periods
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));
