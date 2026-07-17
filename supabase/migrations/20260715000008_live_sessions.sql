create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  session_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text,
  created_by uuid not null references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.live_sessions enable row level security;

create policy "live_sessions_select_public"
  on public.live_sessions
  for select
  using (true);

create policy "live_sessions_write_admin"
  on public.live_sessions
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));
