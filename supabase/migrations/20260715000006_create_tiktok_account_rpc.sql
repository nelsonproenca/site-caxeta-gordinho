-- Atomically creates a managed TikTok account, grants the caller 'owner'
-- access to it, and seeds the 4 default scoring rules from prd.md §4.3
-- (admins can rename/retune/deactivate them afterwards — these are just a
-- starting point, not hardcoded constants). SECURITY DEFINER is required
-- here because tiktok_accounts intentionally has no insert policy and the
-- first admin_account_access row for a new account can't satisfy
-- is_account_owner() (see 20260715000002 and 20260715000003).
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

revoke all on function public.create_tiktok_account(text, text, text) from public;
grant execute on function public.create_tiktok_account(text, text, text) to authenticated;
