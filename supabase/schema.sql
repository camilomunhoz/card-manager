create table if not exists public.rooms (
  id text primary key,
  master_id uuid,
  deck_queue jsonb not null default '[]'::jsonb,
  market_cards jsonb not null default '[]'::jsonb,
  players jsonb not null default '{}'::jsonb,
  last_dice_roll jsonb,
  created_at timestamptz not null default now()
);

alter table public.rooms
  add column if not exists last_dice_roll jsonb;

alter table public.rooms enable row level security;

create policy "rooms_read_all" on public.rooms
  for select
  using (true);

create policy "rooms_insert_all" on public.rooms
  for insert
  with check (true);

create policy "rooms_update_all" on public.rooms
  for update
  using (true);
