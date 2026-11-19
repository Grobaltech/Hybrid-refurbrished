-- Staff identity, role and per-user access controls.
-- This migration is compatible with an existing Hybrid Shop schema.
do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'cashier');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role public.user_role not null default 'cashier',
  phone text,
  email text,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists disabled boolean not null default false;

create table if not exists public.user_caps (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cap text not null,
  allowed boolean not null default true,
  primary key (user_id, cap)
);
create table if not exists public.user_page_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  page text not null,
  allowed boolean not null default true,
  primary key (user_id, page)
);

alter table public.profiles enable row level security;
alter table public.user_caps enable row level security;
alter table public.user_page_access enable row level security;

-- A signed-in user may read their own profile; privileged writes are performed
-- only by the Edge Function using the server-side service-role key.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "read own capabilities" on public.user_caps;
create policy "read own capabilities" on public.user_caps for select to authenticated using (user_id = auth.uid());
drop policy if exists "read own page access" on public.user_page_access;
create policy "read own page access" on public.user_page_access for select to authenticated using (user_id = auth.uid());
