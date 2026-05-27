"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  Globe,
  ScanLine,
  ArrowRight,
  BarChart3,
  Clock,
} from "lucide-react";

function QuickIpCheck() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<{
    ip: string;
    abuseScore: number;
    country: string;
    isp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/lookup?ip=${encodeURIComponent(ip.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lookup failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 15) return "text-green-400";
    if (score <= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score < 15) return "Clean";
    if (score <= 50) return "Suspicious";
    return "Threat";
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        Quick IP Check
      </h3>
      <form onSubmit={handleCheck} className="flex gap-2 mb-4">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="Enter an IP address..."
          className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={loading || !ip.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Checking
            </span>
          ) : (
            "Check"
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">IP Address</span>
            <span className="font-mono text-foreground">{result.ip}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Abuse Score</span>
            <span className={`font-semibold ${getScoreColor(result.abuseScore)}`}>
              {result.abuseScore}% — {getScoreLabel(result.abuseScore)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Country</span>
            <span className="text-foreground">{result.country || "Unknown"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">ISP</span>
            <span className="text-foreground truncate max-w-[180px]">{result.isp || "Unknown"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: "IP Reputation Lookup",
    description:
      "Check any IP address against AbuseIPDB with instant threat scoring, country info, and ISP details.",
  },
  {
    icon: Globe,
    title: "Domain Reputation",
    description:
      "Analyze domain names for malicious activity, phishing, and spam associations.",
  },
  {
    icon: ScanLine,
    title: "Port Scanner",
    description:
      "Scan target hosts for open ports and detect potentially exposed services.",
  },
  {
    icon: BarChart3,
    title: "Threat Analytics",
    description:
      "Visualize threat patterns with interactive charts and trend analysis over time.",
  },
  {
    icon: Clock,
    title: "Scan History",
    description:
      "Keep a complete audit trail of all your IP, domain, and port scans for compliance.",
  },
  {
    icon: ShieldCheck,
    title: "Real-time Alerts",
    description:
      "Get instant notifications when high-threat IPs or malicious domains are detected.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Radial green gradient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34, 197, 94, 0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%), radial-gradient(ellipse 30% 30% at 20% 70%, rgba(34, 197, 94, 0.03) 0%, transparent 50%)",
        }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Centry"
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Centry
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left Column — Text */}
            <div>
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
                Cybersecurity Threat Monitor
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Know the threat level of any{" "}
                <span className="text-primary">IP, domain, or port</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg max-w-lg">
                Centry gives security teams and sysadmins instant threat intelligence
                with real-time IP reputation, domain analysis, port scanning, and
                actionable alerts—all in one dashboard.
              </p>

              {/* Bullet Points */}
              <ul className="mt-8 space-y-3">
                {[
                  "Real-time IP reputation via AbuseIPDB",
                  "Deep domain & port analysis",
                  "Interactive threat analytics & charts",
                  "Email/webhook alerts on high-threat findings",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Column — Quick IP Check Card */}
            <div className="w-full max-w-md mx-auto md:mx-0 md:justify-self-end">
              <QuickIpCheck />
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="border-y border-border/40 bg-background/50">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { label: "IPs Checked", value: "10K+" },
                { label: "Threats Flagged", value: "1.2K+" },
                { label: "Domains Analyzed", value: "5K+" },
                { label: "Ports Scanned", value: "50K+" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-foreground md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Everything you need to stay secure
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
              From quick IP lookups to deep port scans, Centry equips you with
              the threat intelligence to act fast.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/50 bg-card/30 p-6 hover:border-border/80 hover:bg-card/50 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Centry"
                width={22}
                height={22}
                className="rounded-sm"
              />
              <span className="text-sm font-semibold text-foreground">
                Centry
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Centry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}