# Setting it up

Takes about 10 minutes if you already have a Supabase account.

## What you need

- Node.js 20+
- pnpm
- A [Supabase](https://supabase.com) project (free tier works)
- AbuseIPDB and VirusTotal API keys — both have free tiers

---

## 1. Clone and install

```bash
git clone https://github.com/Jayden-j/ThreatSnipe.git
cd ThreatSnipe
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`, then:

```bash
pnpm dev
```

---

## 2. Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page — never expose this client-side |
| `ABUSEIPDB_API_KEY` | [abuseipdb.com/account/api](https://www.abuseipdb.com/account/api) |
| `VIRUSTOTAL_API_KEY` | [virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey) |
| `CRON_SECRET` | Run `openssl rand -hex 32` and paste the output |
| `SITE_URL` | Your deployed URL, e.g. `https://yourapp.vercel.app` |

DNS records, SSL, WHOIS, port scanning, and server status work with no API keys at all.

---

## 3. Run the SQL migrations

Go to your Supabase dashboard → **SQL Editor** and run the files from `supabase/migrations/` in this order:

1. `add_assets_table.sql`
2. `add_domain_scans.sql`
3. `add_port_scans.sql`
4. `add_alerts_table.sql`
5. `add_read_column.sql`
6. `add_user_settings.sql`
7. `migrate_alerts_v2.sql`

Each file creates the tables ThreatSnipe needs with RLS already set up — you don't need to configure anything else in the dashboard for the database to work.

---

## 4. Background monitoring

This is what makes automated asset checks actually run. Don't use Vercel Cron for this — on the free tier you only get 2 jobs and they can only run once a day at minimum. Supabase's built-in pg_cron is unlimited on the free tier.

**Enable the extensions first.** Go to Supabase → **Database → Extensions** and enable:
- `pg_cron`
- `pg_net`

**Then run `setup_monitoring_cron.sql`** from `supabase/migrations/` in the SQL editor. Before you run it, open the file and swap out the two placeholder values:
- Replace `YOUR_SITE_URL` with your actual deployment URL
- Replace `YOUR_CRON_SECRET` with the same value you put in `CRON_SECRET`

The job runs every minute but only checks assets whose interval has elapsed — so an asset set to every 60 minutes gets checked once an hour, not every minute.

---

## 5. OAuth login (optional)

In your Supabase dashboard → **Authentication → Providers**, enable GitHub and/or Google:

1. Paste in the client ID and secret from each provider's developer console
2. Add the callback URL to each OAuth app:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
3. Under **Authentication → URL Configuration**, set Site URL to your prod URL and add `http://localhost:3000/**` to the Redirect URLs list

---

## 6. Discord / Slack alerts (optional)

Once the app is running, go to **Settings** to add webhook URLs for Discord or Slack. There's a test button to confirm delivery before you turn alerts on for your assets.
