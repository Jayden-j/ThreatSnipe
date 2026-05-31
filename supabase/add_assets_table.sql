-- Run this in Supabase SQL Editor
-- Asset Management tables

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  target text NOT NULL,
  type text NOT NULL CHECK (type IN ('ip', 'domain', 'cidr')),
  checks_enabled jsonb NOT NULL DEFAULT '{
    "ip_lookup": false,
    "domain_lookup": false,
    "port_scan": false,
    "blacklist": false,
    "dns_records": false,
    "whois": false,
    "ssl": false,
    "email_security": false,
    "server_status": false
  }',
  monitoring_enabled boolean NOT NULL DEFAULT false,
  check_interval integer NOT NULL DEFAULT 60,
  alerts_enabled boolean NOT NULL DEFAULT false,
  alert_severities text[] DEFAULT '{critical,high}',
  alert_channels text[] DEFAULT '{}',
  last_checked_at timestamptz,
  last_status text CHECK (last_status IN ('clean', 'suspicious', 'threat', 'unknown')) DEFAULT 'unknown',
  checks_passed integer DEFAULT 0,
  checks_total integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE asset_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tool_type text NOT NULL,
  result jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('clean', 'suspicious', 'threat', 'error')),
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assets" ON assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own asset results" ON asset_results FOR ALL USING (auth.uid() = user_id);