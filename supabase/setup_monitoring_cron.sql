-- ============================================================
-- ThreatSnipe — Background Asset Monitoring Setup
-- Run this in: Supabase Dashboard > SQL Editor
--
-- Before running:
--   1. Enable pg_cron and pg_net in Dashboard > Extensions
--   2. Replace YOUR_APP_URL with your Vercel deployment URL
--      e.g. https://threat-snipe.vercel.app
--   3. Replace YOUR_CRON_SECRET with the value you added
--      to Vercel environment variables as CRON_SECRET
-- ============================================================

-- Schedule: call /api/cron/monitor every minute
SELECT cron.schedule(
  'threatsnipe-monitor-assets',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://threatsnipe.vercel.app/api/cron/monitor',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer 3fcfa48f28278355681606a3266582e81ab0b72b05718f93107d291fdd39e965'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── To verify the job was created ──────────────────────────
-- SELECT * FROM cron.job;

-- ── To remove the job later ────────────────────────────────
-- SELECT cron.unschedule('threatsnipe-monitor-assets');
