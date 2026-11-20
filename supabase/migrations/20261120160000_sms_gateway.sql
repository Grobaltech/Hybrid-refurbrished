-- Africa's Talking SMS history for each Hybrid Shop workspace.
create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_phone text not null,
  message text not null,
  provider text not null default 'africas_talking',
  provider_message_id text,
  provider_status text not null default 'queued',
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sms_messages_shop_created_idx on public.sms_messages(shop_id, created_at desc);
create index if not exists sms_messages_status_idx on public.sms_messages(shop_id, provider_status);
alter table public.sms_messages enable row level security;
revoke all on public.sms_messages from anon, authenticated;
grant select on public.sms_messages to authenticated;
drop policy if exists "Shop directors read own SMS history" on public.sms_messages;
create policy "Shop directors read own SMS history"
on public.sms_messages for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'admin'
      and p.disabled = false
      and p.shop_id = sms_messages.shop_id
  )
);
