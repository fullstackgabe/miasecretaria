create table if not exists public.profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  phone             text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  callmebot_key     text check (callmebot_key is null or length(callmebot_key) between 4 and 40),
  callmebot_phone   text,
  whatsapp_verified boolean not null default false,
  timezone          text not null default 'America/Sao_Paulo',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.appointments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  starts_at  timestamptz not null,
  location   text,
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_starts_idx on public.appointments (user_id, starts_at);

alter table public.appointments enable row level security;

drop policy if exists "own appointments" on public.appointments;
create policy "own appointments" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  remind_at       timestamptz not null,
  status          text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts        int not null default 0,
  next_attempt_at timestamptz,
  locked_at       timestamptz,
  sent_at         timestamptz,
  last_error      text,
  created_at      timestamptz not null default now()
);

create index if not exists reminders_due_idx on public.reminders (remind_at) where status in ('pending','sending');
create index if not exists reminders_appointment_idx on public.reminders (appointment_id);

alter table public.reminders enable row level security;

drop policy if exists "own reminders" on public.reminders;
create policy "own reminders" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_user_created_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "own messages" on public.chat_messages;
create policy "own messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.claim_due_reminders(batch int default 50, max_attempts int default 5)
returns setof public.reminders
language sql
security definer
set search_path = public
as $$
  update public.reminders r
     set status = 'sending',
         attempts = r.attempts + 1,
         locked_at = now()
   where r.id in (
     select id
       from public.reminders
      where remind_at <= now()
        and attempts < max_attempts
        and (
          (status = 'pending' and (next_attempt_at is null or next_attempt_at <= now()))
          or (status = 'sending' and locked_at < now() - interval '5 minutes')
        )
      order by remind_at
      limit batch
      for update skip locked
   )
  returning r.*;
$$;

revoke all on function public.claim_due_reminders(int, int) from public, anon, authenticated;

create table if not exists public.subscribers (
  email      text primary key,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

drop policy if exists "read own subscription" on public.subscribers;
create policy "read own subscription" on public.subscribers
  for select using ( lower(auth.jwt() ->> 'email') = lower(email) );

create table if not exists public.leads (
  email      text primary key,
  first_seen timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "insert own lead" on public.leads;
create policy "insert own lead" on public.leads
  for insert with check ( lower(auth.jwt() ->> 'email') = lower(email) );

drop policy if exists "read own lead" on public.leads;
create policy "read own lead" on public.leads
  for select using ( lower(auth.jwt() ->> 'email') = lower(email) );
