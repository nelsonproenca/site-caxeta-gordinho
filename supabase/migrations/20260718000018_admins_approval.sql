-- Self-signup (login-form.tsx's "Criar conta" mode) used to grant full admin
-- capability immediately after email confirmation — any visitor could sign
-- up and call create_tiktok_account() to spin up their own managed account.
-- New admins now land in 'pending' and can't do anything until an existing
-- approved admin reviews them (approve, or delete the request outright).
--
-- Backfill existing rows as 'approved' first (so already-active admins don't
-- get locked out), then flip the column default forward for new signups —
-- the classic two-step pattern for adding a NOT NULL column with different
-- backfill vs. go-forward defaults.
alter table public.admins
  add column status text not null default 'approved' check (status in ('pending', 'approved'));

alter table public.admins
  alter column status set default 'pending';

-- Mirrors has_account_access()/is_account_owner() (20260715000003):
-- SECURITY DEFINER avoids RLS recursion when used from a policy on admins
-- itself.
create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid() and status = 'approved'
  );
$$;

revoke all on function public.is_approved_admin() from public;
grant execute on function public.is_approved_admin() to authenticated;

-- admins_select_own (20260715000001) only lets a caller see their own row —
-- extend it so an approved admin can also see every admin row (not just
-- 'pending' ones). This has to cover *all* rows, not only pending: Postgres
-- RLS checks a mutated row against SELECT policies too whenever a client
-- expects the affected row back (which PostgREST's UPDATE does even without
-- an explicit .select()) — a policy scoped to status = 'pending' would let
-- the approve UPDATE find the row (via admins_approve_pending's USING) but
-- then fail with "new row violates row-level security policy" because the
-- row is 'approved' by the time anything tries to read it back.
create policy "admins_select_all_for_approved"
  on public.admins
  for select
  using (public.is_approved_admin());

-- Approve a pending admin (pending -> approved only, via the app's
-- "Aprovar" action) — this is the only status transition this policy
-- allows; anything else the `with check` rejects.
create policy "admins_approve_pending"
  on public.admins
  for update
  using (status = 'pending' and public.is_approved_admin())
  with check (status = 'approved');

-- Rejecting ("Excluir") a pending admin removes the underlying auth.users
-- row instead (admins.id -> auth.users.id is ON DELETE CASCADE — see
-- lib/actions/admin-approvals.ts), which requires the service-role admin
-- API, not a DELETE RLS policy here.

-- Defense in depth to match matches_validate_account's precedent (don't
-- trust a single layer): reject account creation outright if the caller's
-- admins row isn't 'approved', even though the pending-admin proxy.ts
-- redirect (see lib/supabase/middleware.ts) should already keep a pending
-- admin away from every /admin page that could reach this RPC.
create or replace function public.create_tiktok_account(
  p_handle text,
  p_display_name text,
  p_avatar_url text default null
)
returns public.tiktok_accounts
language plpgsql
security definer set search_path = public
as $$
declare
  v_account public.tiktok_accounts;
begin
  if auth.uid() is null then
    raise exception 'create_tiktok_account requires an authenticated admin';
  end if;

  if not public.is_approved_admin() then
    raise exception 'create_tiktok_account requires an approved admin';
  end if;

  insert into public.tiktok_accounts (handle, display_name, avatar_url)
  values (lower(ltrim(p_handle, '@')), p_display_name, p_avatar_url)
  returning * into v_account;

  insert into public.admin_account_access (admin_id, tiktok_account_id, role)
  values (auth.uid(), v_account.id, 'owner');

  insert into public.scoring_rules (tiktok_account_id, name, points) values
    (v_account.id, 'Vitória lambreta', 3),
    (v_account.id, 'Vitória normal', 2),
    (v_account.id, 'Derrota normal', -1),
    (v_account.id, 'Derrota lambreta', -3);

  return v_account;
end;
$$;
