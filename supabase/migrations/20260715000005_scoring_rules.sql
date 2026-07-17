create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  name text not null,
  points integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.scoring_rules enable row level security;

create policy "scoring_rules_select_public"
  on public.scoring_rules
  for select
  using (true);

create policy "scoring_rules_write_admin"
  on public.scoring_rules
  for all
  using (public.has_account_access(tiktok_account_id))
  with check (public.has_account_access(tiktok_account_id));
