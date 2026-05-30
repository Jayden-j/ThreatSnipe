-- Create alerts table for consolidated alert feed
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_table text not null check (source_table in ('scans', 'domain_scans', 'port_scans')),
  source_record_id uuid not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  category text not null check (category in ('ip_threat', 'malicious_domain', 'port_risk')),
  title text not null,
  message text,
  metadata jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamp with time zone default now() not null
);

-- Indexes for efficient queries
create index idx_alerts_user_read on public.alerts (user_id, read) where read = false;
create index idx_alerts_user_severity on public.alerts (user_id, severity);
create index idx_alerts_created_at on public.alerts (created_at desc);

-- Enable RLS
alter table public.alerts enable row level security;

-- RLS policies
create policy "Users can view their own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Service role can insert alerts"
  on public.alerts for insert
  with check (true);

create policy "Users can update their own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table public.alerts;