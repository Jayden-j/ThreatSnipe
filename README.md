<div align="center">
  <img src="public/ThreatSnipe logo.svg" alt="ThreatSnipe" width="56" />
  <h1>ThreatSnipe</h1>
  <p>Monitor your assets. Get alerted when something changes.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  </p>

  <a href="https://threatsnipe.vercel.app">
    <img src="https://img.shields.io/badge/Live_Demo-%E2%86%92-6366f1?style=for-the-badge" />
  </a>
</div>

---

Add an IP, domain, or subnet. ThreatSnipe watches it — checking reputation, blacklists, and threat feeds on a schedule. The moment something changes, you get alerted. Every tool you need to investigate further is already in the same place.

---

## Screenshots

> Live at **[threatsnipe.vercel.app](https://threatsnipe.vercel.app)**

| Dashboard | Asset Detail | Lookup Tool |
|:---:|:---:|:---:|
| *coming soon* | *coming soon* | *coming soon* |

---

## How it works

**1. Add your assets**
Register the IPs, domains, or CIDR ranges you want to watch. Single targets or entire subnets.

**2. ThreatSnipe monitors them**
Automated checks run against AbuseIPDB, VirusTotal, and 20+ DNSBL providers. Results are stored, charted, and compared against previous scans.

**3. You get alerted**
When a monitored asset's threat status changes — new blacklist hit, rising abuse score, previously clean IP flagged — you get notified immediately.

**4. Dig deeper with the built-in tools**
Every tool is available on-demand: port scanner, DNS lookup, WHOIS, SSL checker, email security audit. No tab-switching, no separate accounts.

---

## Tools

| | Tool | What it checks |
|---|---|---|
| 🛡️ | **IP Reputation** | AbuseIPDB confidence score, ISP, geolocation, report history |
| 🌐 | **VirusTotal** | Domain/IP verdict across 70+ antivirus and threat intelligence engines |
| 📋 | **Blacklist Check** | 20+ DNSBL providers checked simultaneously |
| 🔬 | **CIDR Scan** | Entire subnets /8–/32 — surfaces any flagged hosts in one pass |
| 🔌 | **Port Scanner** | Open TCP ports and inferred running services |
| 🌍 | **DNS Records** | A, AAAA, MX, TXT, CNAME, NS — full record set |
| 📄 | **WHOIS** | Registrar, creation/expiry dates, ownership records |
| 🔒 | **SSL Checker** | Certificate validity, chain, issuer, expiry |
| 📧 | **Email Security** | SPF, DKIM, DMARC validation |
| 🖥️ | **Server Status** | HTTP status, latency, redirect chains |
| 📦 | **Bulk Check** | Up to 20 targets in a single scan |

---

## Stack

**Why this stack, not just what it is:**

- **Next.js 16 App Router** — dashboard data is fetched server-side with async Server Components. No client-side waterfalls, no loading spinners on page load.
- **Supabase** — handles auth (email + GitHub/Google OAuth), PostgreSQL database, and Row-Level Security. RLS policies enforce that users can only query their own scans and assets at the database layer — not just the application layer.
- **API Route Handlers** — every call to AbuseIPDB and VirusTotal is proxied through `/api/` endpoints. API keys never reach the browser.
- **Tailwind CSS 4 + shadcn/ui** — custom dark design system built on Radix UI primitives for accessibility.
- **Framer Motion + Recharts** — scan trend charts, threat breakdown visualization, page transitions.
- **node-forge** — SSL certificate parsing directly in the server runtime without shelling out.

---

## Architecture

```
src/
├── app/
│   ├── (app)/              # Protected — redirects to /login if no session
│   │   ├── dashboard/      # Async Server Component, fetches all KPIs server-side
│   │   ├── assets/         # Asset list + per-asset detail and history
│   │   ├── alerts/         # Alert feed with read/unread state
│   │   ├── lookup/         # IP reputation (AbuseIPDB)
│   │   ├── domain/         # VirusTotal scan
│   │   ├── blacklist/      # DNSBL check
│   │   ├── ports/          # Port scanner
│   │   ├── dns/            # DNS records
│   │   ├── ssl/            # SSL checker
│   │   ├── whois/          # WHOIS lookup
│   │   ├── email-security/ # SPF/DKIM/DMARC
│   │   ├── server-status/  # HTTP health check
│   │   └── bulk/           # Batch scanning
│   ├── api/                # Route handlers — external API calls proxied here
│   ├── login/
│   └── register/
└── lib/supabase/           # SSR-safe client and server helpers
```

---

## Running locally

```bash
git clone https://github.com/Jayden-j/ThreatSnipe.git
cd ThreatSnipe
pnpm install
cp .env.example .env.local
pnpm dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-side only |
| `ABUSEIPDB_API_KEY` | [abuseipdb.com/account/api](https://www.abuseipdb.com/account/api) |
| `VIRUSTOTAL_API_KEY` | [virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey) |
| `CRON_SECRET` | Secret for the `/api/cron/monitor` endpoint — generate with `openssl rand -hex 32` |

DNS records, SSL, WHOIS, port scanning, and server status work without any API keys.

---

## What building this taught me

Working with real threat intelligence data formats forced decisions I wouldn't have made otherwise. AbuseIPDB returns a confidence score, not a binary — deciding when to call something "suspicious" vs "malicious" required reading their documentation on how scores are calculated and what report thresholds mean in practice.

Proxying external API calls through route handlers was a deliberate choice after reading about Next.js security patterns. The alternative — calling AbuseIPDB from the client — would expose the API key in browser network requests. The route handler pattern adds one hop but keeps credentials server-side.

Supabase RLS was the other thing that took real thought. Writing `USING (user_id = auth.uid())` policies sounds simple until you're debugging why a join across two RLS-protected tables returns nothing. Understanding that RLS policies compose across joins changed how I structured some of the asset + alert queries.

---

<div align="center">
  <sub>
    Built by <a href="https://github.com/Jayden-j">Jayden Johnson</a>
    &nbsp;·&nbsp;
    Seeking cybersecurity internship opportunities
  </sub>
</div>
