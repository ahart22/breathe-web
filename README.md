# Breathe (web)

Sign in, do a timed breathing exercise, and your sessions are saved privately
to your own account. Supabase holds the accounts and the database, Vercel
serves the site.

The macOS menu bar version lives at `ahart22/breathe-menubar`. This is the
same exercise, reachable from any browser and synced across devices.

## What it does

- **Email and password accounts** through Supabase Auth
- **The exercise** — four seconds in, two held, six out; the phyllotaxis disc
  synced to the breath, phase guidance with a live countdown
- **A receipt** when you finish, and also when you stop early, showing the
  time you actually spent against what you planned
- **Preferences** — session length, study reminders on a custom interval
- **History** — your past sessions and totals

## Setup

### 1. Supabase

Create a project at supabase.com, then run
`supabase/migrations/0001_init.sql` in the SQL editor.

That migration creates both tables, **enables Row Level Security on each, and
writes the policies in the same step**. Please do not split it up: a table
that exists for even one deploy without RLS is a table anyone could read.

Then copy your URL and anon key:

```bash
cp .env.local.example .env.local   # paste the two values in
```

### 2. Run it

```bash
npm install
npm run dev
```

### 3. Deploy

Push to GitHub, import the repo on Vercel, and add the same two environment
variables in the Vercel project settings. Every push to `main` deploys.

## How privacy actually works

Supabase gives the browser a **public** anon key. It ships inside the
JavaScript, so treat it as known to everyone — it is not a secret and is not
what protects anything.

What protects the data is **Row Level Security**. Every policy checks
`auth.uid() = user_id`, which Postgres evaluates from the request's signed
token. A query for someone else's rows returns nothing, because the database
refuses, not because the app asks nicely. The filters in the app code are for
correctness; the database is what enforces it.

The one thing that would undo all of it is the **service_role** key, which
bypasses every policy. It belongs on a server, never in this project, and
never behind a `NEXT_PUBLIC_` name.

## Known limits

**Reminders need this tab open.** Browsers throttle timers in background tabs
and stop them entirely when the tab closes, so the reminder interval only runs
while the page is open. Making reminders work with the browser closed means
web push — a service worker plus something server-side firing on a schedule,
which Supabase Edge Functions and `pg_cron` could do. That is a separate
piece of work.

**Email confirmation is on by default** in Supabase. New accounts have to
click a link before they can sign in. Turn it off under Authentication →
Providers → Email while you are testing.

## Layout

```
app/            pages, the sign-out route
components/     the exercise, receipt, preferences, auth
lib/session.ts  the breath cycle — the one part shared with the Mac app
lib/supabase/   browser and server clients
supabase/       the schema and its RLS policies
middleware.ts   refreshes the session cookie
```
