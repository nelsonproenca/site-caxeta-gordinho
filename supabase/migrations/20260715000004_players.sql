create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  tiktok_handle text not null unique,
  whatsapp text,
  verified_via_tiktok boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

create policy "players_select_public"
  on public.players
  for select
  using (true);

-- No insert/update policy for anon or authenticated: player self-registration
-- (public form) and admin "quick add" (during a live) both go through a
-- single Server Action using the service-role client (lib/supabase/service.ts),
-- so tiktok_handle normalization/dedupe logic lives in exactly one place
-- instead of being duplicated between an RLS policy and application code.

-- Defense in depth: normalize tiktok_handle (lowercase, strip a leading '@')
-- at the database level too, regardless of what the calling code sends.
create or replace function public.normalize_tiktok_handle()
returns trigger
language plpgsql
as $$
begin
  new.tiktok_handle := lower(ltrim(new.tiktok_handle, '@'));
  return new;
end;
$$;

create trigger players_normalize_handle
  before insert or update of tiktok_handle on public.players
  for each row execute function public.normalize_tiktok_handle();
