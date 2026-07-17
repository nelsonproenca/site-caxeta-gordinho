create table public.admin_account_access (
  admin_id uuid not null references public.admins (id) on delete cascade,
  tiktok_account_id uuid not null references public.tiktok_accounts (id) on delete cascade,
  role text not null check (role in ('owner', 'moderator')),
  created_at timestamptz not null default now(),
  primary key (admin_id, tiktok_account_id)
);

alter table public.admin_account_access enable row level security;

-- Helper functions reused by every other table's RLS policies (scoring_rules,
-- score_periods, live_sessions, live_participants, matches, match_results,
-- and future Caxetão/championship tables). SECURITY DEFINER avoids RLS
-- recursion when these are called from a policy on admin_account_access
-- itself, and centralizes the "is this caller an admin/owner of account X"
-- check in one place for the RLS isolation tests called out in the plan's
-- risk section.
create or replace function public.has_account_access(p_tiktok_account_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account_access aaa
    where aaa.tiktok_account_id = p_tiktok_account_id
      and aaa.admin_id = auth.uid()
  );
$$;

create or replace function public.is_account_owner(p_tiktok_account_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account_access aaa
    where aaa.tiktok_account_id = p_tiktok_account_id
      and aaa.admin_id = auth.uid()
      and aaa.role = 'owner'
  );
$$;

revoke all on function public.has_account_access(uuid) from public;
grant execute on function public.has_account_access(uuid) to authenticated;

revoke all on function public.is_account_owner(uuid) from public;
grant execute on function public.is_account_owner(uuid) to authenticated;

create policy "admin_account_access_select_self_or_owner"
  on public.admin_account_access
  for select
  using (
    admin_id = auth.uid()
    or public.is_account_owner(tiktok_account_id)
  );

-- Owners manage who has access to their account (add/remove moderators,
-- change roles). The very first owner row per account is inserted by
-- create_tiktok_account() as SECURITY DEFINER, bypassing this policy —
-- otherwise no one could ever create the first row for a new account.
create policy "admin_account_access_write_owner"
  on public.admin_account_access
  for all
  using (public.is_account_owner(tiktok_account_id))
  with check (public.is_account_owner(tiktok_account_id));

-- Now that is_account_owner() exists, add the update policy for
-- tiktok_accounts (deferred from 20260715000002).
create policy "tiktok_accounts_update_owner"
  on public.tiktok_accounts
  for update
  using (public.is_account_owner(id))
  with check (public.is_account_owner(id));
