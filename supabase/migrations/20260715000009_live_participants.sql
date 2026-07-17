create table public.live_participants (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (live_session_id, player_id)
);

alter table public.live_participants enable row level security;

create policy "live_participants_select_public"
  on public.live_participants
  for select
  using (true);

create policy "live_participants_write_admin"
  on public.live_participants
  for all
  using (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = live_participants.live_session_id
        and public.has_account_access(ls.tiktok_account_id)
    )
  )
  with check (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = live_participants.live_session_id
        and public.has_account_access(ls.tiktok_account_id)
    )
  );
