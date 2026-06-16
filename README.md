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

Add an IP, domain, or subnet. ThreatSnipe watches it — checking reputation, blacklists, and threat feeds on a schedule. The moment something changes, you get alerted. Every tool you need to investigate further is already built in.

---

## Screenshots

> Live at **[threatsnipe.vercel.app](https://threatsnipe.vercel.app)**

![Dashboard](public/Dashbord.png)

![Asset Detail](public/Asset%20Detail.png)

![Lookup Tool](public/Lookup%20Test.png)

---

## How it works

**1. Register your assets**
Add any IP address, domain, or CIDR block — your own infrastructure, a third-party vendor, or a suspicious indicator pulled from an incident. Each asset gets its own check schedule and alert thresholds.

**2. Continuous threat monitoring**
ThreatSnipe runs scheduled checks against threat intelligence feeds (AbuseIPDB, VirusTotal), DNS-based blackhole lists, and direct asset probes. Every result is timestamped and stored so reputation changes are tracked over time, not just the current state.

**3. Alert on status changes**
When an asset crosses a severity threshold — new DNSBL listing, AbuseIPDB confidence score spike, domain flagged malicious across 70+ AV engines — an alert fires and gets pushed to Discord or Slack.

**4. Investigate with built-in OSINT tools**
WHOIS, DNS records, SSL certificate analysis, port enumeration — every reconnaissance tool is available on demand without switching platforms or accounts.

---

## Security concepts

| Concept | How ThreatSnipe applies it |
|---|---|
| **Threat Intelligence (CTI)** | Aggregates IOC data from AbuseIPDB (crowdsourced abuse reports) and VirusTotal (70+ engine verdicts) to score IPs and domains against known indicators of compromise |
| **DNSBL / Reputation Feeds** | Queries 20+ DNS-Based Blackhole Lists simultaneously — the same lists used by mail gateways and edge firewalls to block spam sources, botnets, and malware C2 infrastructure |
| **Abuse Confidence Scoring** | AbuseIPDB's score is probabilistic, not binary. Thresholds (>15 = suspicious, >50 = threat) are modeled on how the score is weighted by report recency, volume, and reporter reputation |
| **Email Security (Anti-Phishing)** | Validates SPF, DKIM, and DMARC records — the three standards that prevent domain spoofing and phishing. Distinguishes between SPF `~all` (softfail, largely ineffective) and `-all` (hardfail, enforced rejection) |
| **TLS / PKI Monitoring** | Parses full X.509 certificate chains to detect expired or soon-to-expire certificates. An expired cert is both a service availability risk and, in some configurations, a vector for MitM if clients fail open |
| **Network Enumeration** | TCP port scanning that flags exposure of high-risk services: FTP (21), Telnet (23), SMB (445), RDP (3389), and database ports commonly targeted during initial access and lateral movement |
| **OSINT / Passive Recon** | WHOIS and DNS record lookups retrieve public registration and infrastructure data without actively probing the target — consistent with passive reconnaissance methodology |
| **CIDR / Subnet Analysis** | Scans /8–/32 ranges to surface any blacklisted or high-abuse hosts in one pass — useful for auditing cloud provider blocks, acquired infrastructure, or ranges seen in threat reports |

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

---

## Security architecture

How the application itself is secured:

- **API key isolation** — Every call to AbuseIPDB and VirusTotal is proxied through server-side route handlers. Credentials never appear in client-side network requests — an application of OWASP API Security Top 10 (API8: Security Misconfiguration).
- **Row-Level Security** — Supabase RLS policies enforce `user_id = auth.uid()` at the database layer. Even a compromised application layer cannot query another user's assets, scans, or alerts — access control is at the data, not just the API.
- **Rate limiting** — Per-user limits enforced via Upstash Redis: 20 req/min for standard tools, 5 req/min for resource-intensive operations (port scan, blacklist check). Prevents abuse and protects third-party API quotas.
- **Cron authentication** — The `/api/cron/monitor` endpoint rejects any request without a valid `Authorization: Bearer` header matched against a secret generated with `openssl rand -hex 32`.
- **Webhook SSRF mitigation** — User-supplied notification webhook URLs are validated server-side to only accept HTTPS endpoints from `discord.com` or `hooks.slack.com`, preventing server-side request forgery via attacker-controlled URLs.
- **CSV injection prevention** — Exported scan data is sanitized before download. Cells beginning with `=`, `+`, `-`, or `@` are escaped to prevent formula injection when opened in spreadsheet software.

---

## Stack

- **Next.js 16 App Router** — dashboard data is fetched server-side with async Server Components. No client-side waterfalls, no loading spinners on page load.
- **Supabase** — handles auth (email + GitHub/Google OAuth), PostgreSQL database, and Row-Level Security. RLS policies enforce data isolation at the database layer, not just the application layer.
- **Upstash Redis** — serverless Redis for per-user, per-endpoint rate limiting across all API routes.
- **Tailwind CSS 4 + shadcn/ui** — custom dark design system built on Radix UI primitives for accessibility.
- **Framer Motion + Recharts** — scan trend charts, threat breakdown visualization, page transitions.
- **node-forge** — X.509 certificate parsing directly in the server runtime without shelling out.
- **GSAP + Three.js** — landing page animations.

---

## Architecture

```
src/
├── app/
│   ├── (app)/              # Protected — redirects to /login if no session
│   │   ├── dashboard/      # Threat overview: KPIs, scan trends, alert feed
│   │   ├── assets/         # Monitored asset management and per-asset detail
│   │   ├── alerts/         # Alert feed — severity filtering, read/dismiss
│   │   ├── history/        # Scan history with trend charts and CSV export
│   │   ├── settings/       # Webhook config (Discord/Slack), auth providers
│   │   ├── snipe/          # Tool hub — categorized tool navigation
│   │   ├── lookup/         # IP reputation (AbuseIPDB)
│   │   ├── domain/         # VirusTotal domain/URL scan
│   │   ├── blacklist/      # DNSBL check
│   │   ├── ports/          # TCP port scanner
│   │   ├── dns/            # Full DNS record inspection
│   │   ├── ssl/            # TLS certificate analysis
│   │   ├── whois/          # WHOIS / registration records
│   │   ├── email-security/ # SPF / DKIM / DMARC validation
│   │   └── server-status/  # HTTP health and latency check
│   ├── api/                # Route handlers — external API calls proxied here
│   ├── login/
│   └── register/
└── lib/
    ├── supabase/           # SSR-safe client, server, and service-role helpers
    ├── notify.ts           # Discord + Slack webhook alert delivery
    ├── ratelimit.ts        # Per-user rate limiting via Upstash Redis
    ├── ssl.ts              # X.509 certificate parsing (node-forge)
    └── csv.ts              # CSV export with formula injection prevention
```

---

## What building this taught me

**Threat scoring isn't binary.** AbuseIPDB returns a confidence score weighted by report recency, volume, and reporter reputation — not a clean yes/no. Setting meaningful thresholds required understanding how the score degrades over time and what report counts actually indicate malicious vs misconfigured behaviour.

**DNSBL lookups work through reverse DNS.** A blacklist check isn't just an API call — it works by reversing the IP octets and querying a known zone (`1.0.168.192.zen.spamhaus.org`). Understanding the lookup format required reading RFC 5782 and the Spamhaus zone documentation, which made the implementation significantly less opaque.

**SPF `~all` is almost useless.** Implementing DMARC/SPF validation revealed a common misconfiguration: most mail servers treat `~all` (softfail) as a pass, so a domain using it gets little spoofing protection. The distinction between `~all`, `-all`, and `+all` is two characters in a DNS record but the difference in enforcement is significant. ThreatSnipe flags softfail as a misconfiguration, not a pass.

**User-supplied URLs are an attack surface.** The notification webhook feature accepts a URL and makes a server-side HTTP request to it — a textbook SSRF scenario. Mitigating it required validating that the URL is HTTPS and that the hostname resolves to a known service (discord.com, hooks.slack.com) before the request is made.

**RLS policies compose across joins in non-obvious ways.** When both `assets` and `asset_results` have `user_id = auth.uid()` policies, a join applies both policies independently. A query can silently return zero rows even when matching data exists if the join doesn't satisfy both policies. Debugging this required understanding how Postgres evaluates RLS on each table in a join, which changed how several asset + alert queries were structured.

---

> For local setup, environment variables, OAuth config, and cron setup — see [SETUP.md](SETUP.md).

---

<div align="center">
  <sub>
    Built by <a href="https://github.com/Jayden-j">Jayden Johnson</a>
    &nbsp;·&nbsp;
    Seeking cybersecurity internship opportunities
  </sub>
</div>
