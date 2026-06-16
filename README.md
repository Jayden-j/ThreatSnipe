<div align="center">
  <img src="public/ThreatSnipe logo.svg" alt="ThreatSnipe" width="56" />
  <h1>ThreatSnipe</h1>
  <p>Monitor your assets. Get alerted when something changes.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/github/last-commit/Jayden-j/ThreatSnipe?style=flat-square&color=6366f1" />
    <img src="https://img.shields.io/badge/license-MIT-6366f1?style=flat-square" />
  </p>

  <a href="https://threatsnipe.vercel.app">
    <img src="https://img.shields.io/badge/Live_Demo-%E2%86%92-6366f1?style=for-the-badge" />
  </a>
</div>

---

Add an IP, domain, or subnet and ThreatSnipe monitors it — checking reputation feeds, blacklists, and DNS records on a schedule. Alerts fire to Discord or Slack when something changes. All the investigation tools are built in.

---

![Dashboard](public/Dashbord.png)

![Asset Detail](public/Asset%20Detail.png)

![Lookup Tool](public/Lookup%20Test.png)

---

## Tools

| | Tool | What it checks |
|---|---|---|
| 🛡️ | **IP Reputation** | AbuseIPDB score, ISP, geolocation, report history |
| 🌐 | **VirusTotal** | Domain/IP verdict across 70+ AV engines |
| 📋 | **Blacklist Check** | 20+ DNSBL providers simultaneously |
| 🔬 | **CIDR Scan** | Entire subnets /8–/32 for flagged hosts |
| 🔌 | **Port Scanner** | Open TCP ports and exposed services |
| 🌍 | **DNS Records** | A, AAAA, MX, TXT, CNAME, NS |
| 📄 | **WHOIS** | Registrar, creation/expiry, ownership |
| 🔒 | **SSL Checker** | X.509 chain, validity, expiry |
| 📧 | **Email Security** | SPF, DKIM, DMARC |
| 🖥️ | **Server Status** | HTTP status, latency, redirect chain |

---

## Stack

- **Next.js 16** — Server Components for data fetching, API route handlers proxy all external calls so keys never hit the browser
- **Supabase** — Postgres with Row-Level Security, auth (email + GitHub/Google OAuth), Realtime for live alerts
- **Upstash Redis** — per-user rate limiting across all API routes
- **Recharts + Framer Motion** — trend charts and page transitions
- **node-forge** — X.509 cert parsing server-side
- **Tailwind CSS 4 + shadcn/ui**

---

## Architecture

```mermaid
graph TD
    User["👤 User"] --> Auth["Login / Register"]
    Auth --> App["Protected App"]

    App --> Dashboard["📊 Dashboard\nKPIs · trends · alerts"]
    App --> Assets["🎯 Asset Monitor\nadd · schedule · alert"]
    App --> Snipe["🔧 Tool Hub"]
    App --> Alerts["🔔 Alert Feed"]
    App --> History["📋 History + CSV Export"]
    App --> Settings["⚙️ Settings\nDiscord · Slack webhooks"]

    Snipe --> Lookup["IP Reputation"]
    Snipe --> Domain["VirusTotal"]
    Snipe --> Blacklist["DNSBL Check"]
    Snipe --> Ports["Port Scanner"]
    Snipe --> DNS["DNS Records"]
    Snipe --> SSL["SSL Checker"]
    Snipe --> WHOIS["WHOIS"]
    Snipe --> Email["Email Security"]
    Snipe --> Server["Server Status"]

    Assets --> Cron["pg_cron\n(Supabase)"]
    Cron --> API["Next.js Route Handlers\n/api/*"]
    API --> AbuseIPDB["AbuseIPDB"]
    API --> VirusTotal["VirusTotal"]
    API --> Public["Public DNS / Net"]

    API --> DB[("Supabase\nPostgres + RLS")]
    DB --> Realtime["Realtime alerts"]
    DB --> Redis["Upstash Redis\nrate limiting"]
```

---

## Things I learned

- SPF `~all` (softfail) gives almost no spoofing protection — most mail servers treat it as a pass. ThreatSnipe flags it as a misconfiguration
- DNSBL lookups work through reverse DNS (RFC 5782), not a REST API — the format clicked once I read how blackhole zones actually work
- RLS policies on joined tables apply independently — a join between two RLS-protected tables can silently return zero rows, which took a while to debug
- User-supplied webhook URLs are an SSRF vector — URLs are validated to HTTPS endpoints on `discord.com` or `hooks.slack.com` only

---

> Setup, environment variables, SQL migrations, and pg_cron config → [SETUP.md](SETUP.md)

<div align="center">
  <sub>Built by <a href="https://github.com/Jayden-j">Jayden Johnson</a> · Seeking cybersecurity internship opportunities</sub>
</div>
