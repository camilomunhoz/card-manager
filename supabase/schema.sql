create table if not exists public.rooms (
  id text primary key,
  master_id uuid,
  deck_queue jsonb not null default '[]'::jsonb,
  market_cards jsonb not null default '[]'::jsonb,
  players jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "rooms_read_all" on public.rooms
  for select
  using (true);
