create table public.port_scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  target text not null,
  host text,
  open_count integer not null default 0,
  closed_count integer not null default 0,
  filtered_count integer not null default 0,
  ports jsonb not null default '[]',
  created_at timestamp with time zone default now() not null
);

alter table public.port_scans enable row level security;

create policy "Users can insert their own port scans"
  on public.port_scans for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own port scans"
  on public.port_scans for select
  using (auth.uid() = user_id);