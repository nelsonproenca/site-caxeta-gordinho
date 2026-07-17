-- Registration rows for a caxetao_event. Self-registration (player, no auth
-- — see players, 20260715000004) and admin manual registration both need the
-- same FIFO queue_position assignment and capacity checks (max_principals /
-- max_substitutes), so there is no insert policy for anon or authenticated
-- here either: both creation paths go through a single Server Action helper
-- (registerPlayerForEvent, lib/caxetao.ts) on the service-role client,
-- keeping that math in one place instead of split across RLS and app code.
-- Status updates after creation (presence marking, cancellation, substitute
-- promotion) are a different story — no shared cross-row math, admin already
-- has direct RLS write access below — so those go through the regular
-- per-request client instead.
create table public.caxetao_registrations (
  id uuid primary key default gen_random_uuid(),
  caxetao_event_id uuid not null references public.caxetao_events (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  registration_type text not null check (registration_type in ('principal', 'substitute')),
  queue_position integer,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'called_up', 'cancelled', 'no_show')),
  registered_at timestamptz not null default now(),
  unique (caxetao_event_id, player_id),
  constraint caxetao_registrations_queue_position_only_for_substitutes
    check (registration_type = 'substitute' or queue_position is null)
);

-- Ordering among substitutes must be unambiguous for FIFO promotion.
create unique index caxetao_registrations_queue_position_unique
  on public.caxetao_registrations (caxetao_event_id, queue_position)
  where queue_position is not null;

alter table public.caxetao_registrations enable row level security;

create policy "caxetao_registrations_select_public"
  on public.caxetao_registrations
  for select
  using (true);

-- Admin/moderator manual registration, presence marking, cancellation, and
-- substitute promotion all go through this policy via the regular
-- per-request client. Self-registration bypasses it entirely (service role,
-- see comment above).
create policy "caxetao_registrations_write_admin"
  on public.caxetao_registrations
  for all
  using (
    exists (
      select 1 from public.caxetao_events ce
      where ce.id = caxetao_registrations.caxetao_event_id
        and public.has_account_access(ce.tiktok_account_id)
    )
  )
  with check (
    exists (
      select 1 from public.caxetao_events ce
      where ce.id = caxetao_registrations.caxetao_event_id
        and public.has_account_access(ce.tiktok_account_id)
    )
  );
