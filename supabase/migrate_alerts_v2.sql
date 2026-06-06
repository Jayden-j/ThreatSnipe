-- ============================================================
-- Alerts v2 migration — asset-centric alert system
-- Run this in Supabase SQL editor
-- ============================================================

-- Step 1: Clear all existing alerts
TRUNCATE TABLE public.alerts;

-- Step 2: Drop the old scan-centric columns
ALTER TABLE public.alerts DROP COLUMN IF EXISTS source_table;
ALTER TABLE public.alerts DROP COLUMN IF EXISTS source_record_id;
ALTER TABLE public.alerts DROP COLUMN IF EXISTS category;

-- Step 3: Add new asset-linked columns
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS asset_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS asset_target text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS check_type text NOT NULL DEFAULT 'ip_lookup';

-- Step 4: Drop temporary defaults (columns now populated via app)
ALTER TABLE public.alerts ALTER COLUMN asset_name DROP DEFAULT;
ALTER TABLE public.alerts ALTER COLUMN asset_target DROP DEFAULT;
ALTER TABLE public.alerts ALTER COLUMN check_type DROP DEFAULT;

-- Step 5: Add index for asset-based queries
CREATE INDEX IF NOT EXISTS idx_alerts_asset_id ON public.alerts (asset_id);

-- Done. Existing indexes on (user_id, read), (user_id, severity), (created_at DESC) remain valid.
