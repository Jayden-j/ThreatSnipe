create table public.domain_scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  domain text not null,
  malicious integer not null default 0,
  suspicious integer not null default 0,
  harmless integer not null default 0,
  undetected integer not null default 0,
  reputation integer not null default 0,
  categories text[],
  last_analysis_date text,
  verdict text check (verdict in ('CLEAN', 'SUSPICIOUS', 'MALICIOUS')) not null,
  created_at timestamp with time zone default now() not null
);

alter table public.domain_scans enable row level security;

create policy "Users can insert their own domain scans"
  on public.domain_scans for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own domain scans"
  on public.domain_scans for select
  using (auth.uid() = user_id);