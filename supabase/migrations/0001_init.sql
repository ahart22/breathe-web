-- Breathe: schema and privacy rules.
--
-- Supabase hands the browser a public "anon" key by design — it ships inside
-- your JavaScript, so treat it as known to everyone. What keeps one person's
-- data from another is Row Level Security, enforced by Postgres on every
-- query. Without RLS, that public key reads the whole table.
--
-- So every table below: created, RLS enabled, policies written. In that order,
-- in the same migration. A table that exists for even one deploy without RLS
-- is a table that was readable by anyone.

-- ---------------------------------------------------------------- sessions

create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  started_at       timestamptz not null default now(),
  pattern          text not null default '4-2-6',
  -- What they set out to do, and what they actually did. Stopping early is
  -- recorded rather than discarded.
  planned_seconds  integer not null check (planned_seconds > 0),
  actual_seconds   integer not null check (actual_seconds >= 0),
  breaths          integer not null check (breaths >= 0),
  completed        boolean not null default false
);

create index if not exists sessions_user_started_idx
  on public.sessions (user_id, started_at desc);

alter table public.sessions enable row level security;

-- Four explicit policies rather than one broad one, so each operation is
-- deliberate. `auth.uid()` is the signed-in user, taken from the request's
-- JWT — it cannot be spoofed from the client.
create policy "read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------- preferences

create table if not exists public.preferences (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  minutes          integer not null default 3  check (minutes between 1 and 60),
  reminders_on     boolean not null default false,
  interval_minutes integer not null default 45 check (interval_minutes between 1 and 480),
  updated_at       timestamptz not null default now()
);

alter table public.preferences enable row level security;

create policy "read own preferences"
  on public.preferences for select
  using (auth.uid() = user_id);

create policy "insert own preferences"
  on public.preferences for insert
  with check (auth.uid() = user_id);

create policy "update own preferences"
  on public.preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Give every new account a preferences row, so the app never has to deal
-- with "signed in but no settings yet".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists preferences_touch on public.preferences;
create trigger preferences_touch
  before update on public.preferences
  for each row execute function public.touch_updated_at();
