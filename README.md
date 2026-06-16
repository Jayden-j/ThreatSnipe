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

Add an IP, domain, or subnet and ThreatSnipe monitors it. It checks reputation feeds, blacklists, and DNS records on a schedule. When something changes, alerts fire to Discord or Slack. Every investigation tool you need is already built in.

---

<!-- Replace with a screen recording showing asset monitoring and alert flow -->
![Demo](public/demo.gif)

---

## Screenshots

![Dashboard](public/Dashbord.png)

![Asset Detail](public/Asset%20Detail.png)

![Lookup Tool](public/Lookup%20Test.png)

<!-- Replace with a screen recording of the lookup tools in action -->
![Tools Demo](public/tools-demo.gif)

---

## Security concepts

| Concept | How it applies |
|---|---|
| **Threat Intelligence** | Classifies IPs and domains against known IOCs using AbuseIPDB and VirusTotal |
| **OSINT / Passive Recon** | WHOIS and DNS lookups pull public data without actively probing the target |
| **DNSBL** | Checks 20+ DNS blackhole lists used by mail gateways and firewalls worldwide |
| **Email Security** | Validates SPF, DKIM, and DMARC to surface phishing-prone domain configurations |
| **Network Enumeration** | Port scanning with flagging for high-risk exposed services like RDP, SMB, and Telnet |
| **TLS / PKI** | Parses full X.509 cert chains to detect expiry and potential MitM risk |

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

| Category | Technology |
|---|---|
| Framework | Next.js 16, App Router, Server Components |
| Database | Supabase Postgres with Row-Level Security |
| Auth | Supabase Auth, email, GitHub OAuth, Google OAuth |
| Background Jobs | Supabase pg_cron with pg_net |
| Rate Limiting | Upstash Redis |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts, Framer Motion |
| Cert Parsing | node-forge |

API keys are never exposed to the browser. Every external call to AbuseIPDB and VirusTotal goes through Next.js route handlers server-side.

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

- SPF `~all` (softfail) gives almost no spoofing protection. Most mail servers treat it as a pass, so ThreatSnipe flags it as a misconfiguration instead of clean
- DNSBL lookups work through reverse DNS (RFC 5782), not a REST API. The format made more sense once I read how blackhole zones actually work
- RLS policies on joined tables apply independently. A join between two RLS-protected tables can silently return zero rows with no error, which took a while to debug
- User-supplied webhook URLs are an SSRF vector. All URLs are validated to HTTPS endpoints on `discord.com` or `hooks.slack.com` before any request is made

---

> Setup, SQL migrations, env vars, and pg_cron config are in [SETUP.md](SETUP.md)

<div align="center">
  <sub>Built by <a href="https://github.com/Jayden-j">Jayden Johnson</a> · Seeking cybersecurity internship opportunities</sub>
</div>
