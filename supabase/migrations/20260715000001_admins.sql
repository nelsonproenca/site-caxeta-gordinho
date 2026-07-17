-- Admins are a 1:1 extension of auth.users (admins.id = auth.users.id), not a
-- decoupled identity table. This keeps every RLS policy that needs "is this
-- caller an admin/moderator of account X" a direct auth.uid() comparison
-- instead of an extra join. See the engineering plan, M0 step 6.

create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins_select_own"
  on public.admins
  for select
  using (id = auth.uid());

-- Rows are populated from auth.users on signup, never written by clients
-- directly (there is no insert/update policy for anon/authenticated).
create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.admins (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();
