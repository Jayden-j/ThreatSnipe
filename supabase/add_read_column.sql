-- Add read column to scans table (for IP threat alerts)
ALTER TABLE IF EXISTS public.scans ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;

-- Add read column to domain_scans table (for malicious domain alerts)
ALTER TABLE IF EXISTS public.domain_scans ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;

-- Create index for efficient unread counting
CREATE INDEX IF NOT EXISTS idx_scans_user_unread ON public.scans (user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_domain_scans_user_unread ON public.domain_scans (user_id, read) WHERE read = false;

-- Enable real-time for these tables (for the subscription feature)
-- Note: Supabase real-time is typically enabled via the dashboard, but we'll ensure replication is enabled via SQL
alter publication supabase_realtime add table public.scans;
alter publication supabase_realtime add table public.domain_scans;