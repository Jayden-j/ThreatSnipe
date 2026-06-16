# Running ThreatSnipe locally

## Prerequisites

- Node.js 20+
- pnpm
- A [Supabase](https://supabase.com) project
- AbuseIPDB and VirusTotal API keys (free tiers work)

## Install

```bash
git clone https://github.com/Jayden-j/ThreatSnipe.git
cd ThreatSnipe
pnpm install
cp .env.example .env.local
pnpm dev
```

## Environment variables

Fill in `.env.local` with the following:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (keep this server-side only) |
| `ABUSEIPDB_API_KEY` | [abuseipdb.com/account/api](https://www.abuseipdb.com/account/api) |
| `VIRUSTOTAL_API_KEY` | [virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey) |
| `CRON_SECRET` | Generate with `openssl rand -hex 32` |
| `SITE_URL` | Your deployment URL, e.g. `https://threatsnipe.vercel.app` |

DNS records, SSL, WHOIS, port scanning, and server status work without any API keys.

## OAuth setup (GitHub / Google)

In your [Supabase dashboard](https://supabase.com/dashboard) → **Authentication → Providers**:

1. Enable **GitHub** and/or **Google** and paste in the respective client ID and secret.
2. Add your redirect URL to each provider's allowed callback list:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-domain>/auth/callback`
3. Under **Authentication → URL Configuration**, set **Site URL** to your production URL and add `http://localhost:3000/**` to **Redirect URLs**.

No extra environment variables are needed — the Supabase anon key already covers the OAuth flow.

## Background monitoring (cron)

The `/api/cron/monitor` endpoint runs all scheduled asset checks. It requires a `POST` with `Authorization: Bearer <CRON_SECRET>`.

**On Vercel**, add a `vercel.json` at the repo root:

```json
{
  "crons": [
    {
      "path": "/api/cron/monitor",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Vercel automatically injects the `Authorization` header when `CRON_SECRET` is set in your project's environment variables. Adjust the schedule to taste (`*/15` = every 15 minutes).

**Without Vercel**, trigger it manually or from any cron service:

```bash
curl -X POST https://<your-domain>/api/cron/monitor \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

## Notification webhooks (optional)

Go to **Settings** inside the app to configure Discord and/or Slack webhooks. A test button is available to verify delivery before enabling alerts on your assets.
