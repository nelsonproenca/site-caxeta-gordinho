create table public.tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tiktok_accounts enable row level security;

create policy "tiktok_accounts_select_public"
  on public.tiktok_accounts
  for select
  using (true);

-- No insert policy here on purpose: accounts are only created through the
-- create_tiktok_account() RPC (see 20260715000006), which atomically inserts
-- the account, grants the caller the 'owner' row in admin_account_access, and
-- seeds default scoring_rules. The update policy (owner-only) is added in
-- 20260715000003, once is_account_owner() exists.
