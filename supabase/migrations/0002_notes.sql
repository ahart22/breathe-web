-- Reflections: the short note a user writes and saves after (or instead of)
-- a breathing session. This is the thing a visitor types, saves, and sees
-- again when they come back on another machine.
--
-- Row Level Security is enabled in the same migration that creates the table,
-- so there is never a window where the table exists unprotected.

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

-- Every policy keys off auth.uid(). An anonymous request has no uid, so it
-- matches nothing and the table reads as empty rather than erroring — which
-- is what makes "nobody can read it without logging in" true at the database,
-- not merely in the application.

create policy "read own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);
