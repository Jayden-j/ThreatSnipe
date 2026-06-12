"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Zap, BarChart3, BellRing, Shield, Search, Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  };
}

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

const FEATURES = [
  { icon: Zap,      label: "Instant threat scoring across AbuseIPDB, VirusTotal & 20+ DNSBL providers" },
  { icon: BellRing, label: "Real-time alerts the moment an asset hits a blacklist" },
  { icon: BarChart3,label: "Historical analytics, trend reports, and one-click CSV export" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "github" | "google") => {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.08 0.013 270)" }}>

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <motion.div
            className="absolute rounded-full"
            style={{
              top: "-15%", right: "-10%", width: 600, height: 600,
              background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.07) 50%, transparent 75%)",
              filter: "blur(60px)",
            }}
            animate={{ x: [0, 35, -15, 0], y: [0, -20, 18, 0], scale: [1, 1.08, 0.95, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: "0%", left: "-12%", width: 550, height: 550,
              background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 50%, transparent 75%)",
              filter: "blur(80px)",
            }}
            animate={{ x: [0, -30, 22, 0], y: [0, 25, -30, 0], scale: [1, 0.93, 1.06, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.2) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.25,
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ThreatSnipe%20logo.svg" alt="" width={28} height={28} aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide" style={{ color: "oklch(0.97 0 0)" }}>
            ThreatSnipe
          </span>
        </div>

        {/* Dashboard preview card — replace src with /dashboard-preview.png */}
        <motion.div
          {...fadeUp(0.15)}
          className="relative z-10 my-auto"
          style={{ marginTop: "2rem", marginBottom: "2rem" }}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid rgba(99,102,241,0.2)",
              background: "oklch(0.10 0.012 270)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
            }}
          >
            <DashboardMockup />
          </div>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10">
          <motion.p {...fadeUp(0.1)} className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "rgba(165,180,252,0.6)" }}>
            Threat Intelligence Platform
          </motion.p>
          <motion.h2 {...fadeUp(0.2)} className="font-display text-4xl xl:text-5xl leading-[1.08] tracking-tight" style={{ color: "oklch(0.97 0 0)" }}>
            Know every threat,
            <br />
            <span className="italic" style={{ color: "#a5b4fc" }}>before it strikes.</span>
          </motion.h2>

          <motion.div {...fadeUp(0.3)} className="mt-6 flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  <Icon className="h-2.5 w-2.5" style={{ color: "#818cf8" }} />
                </div>
                <span className="text-xs leading-snug" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.4)} className="relative z-10 flex items-center gap-2 text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} aria-hidden="true" />
          All systems operational
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div
          className="hidden lg:block absolute inset-y-0 left-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.25) 30%, rgba(99,102,241,0.25) 70%, transparent)" }}
          aria-hidden="true"
        />

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ThreatSnipe%20logo.svg" alt="" width={26} height={26} aria-hidden="true" />
            <span className="text-sm font-semibold" style={{ color: "oklch(0.97 0 0)" }}>ThreatSnipe</span>
          </motion.div>

          <motion.div {...fadeUp(0.05)}>
            <h1 className="font-display text-3xl leading-tight" style={{ color: "oklch(0.97 0 0)" }}>
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(148,163,184,0.7)", fontFamily: "var(--font-body)" }}>
              No account?{" "}
              <Link
                href="/register"
                className="font-medium transition-colors"
                style={{ color: "#818cf8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}
              >
                Sign up free →
              </Link>
            </p>
          </motion.div>

          {error && (
            <motion.div {...fadeUp(0)} className="mt-5">
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* OAuth */}
          <motion.div {...fadeUp(0.15)} className="mt-7 grid grid-cols-2 gap-3">
            {(["github", "google"] as const).map((provider) => (
              <button
                key={provider}
                onClick={() => handleOAuth(provider)}
                className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: "oklch(0.11 0.010 270)", border: "1px solid oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.15 0.008 270)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.11 0.010 270)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.18 0.006 270)";
                }}
              >
                {provider === "github" ? <GitHubIcon className="h-4 w-4" aria-hidden="true" /> : <GoogleIcon className="h-4 w-4" aria-hidden="true" />}
                {provider === "github" ? "GitHub" : "Google"}
              </button>
            ))}
          </motion.div>

          {/* Divider */}
          <motion.div {...fadeUp(0.2)} className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full" style={{ borderTop: "1px solid oklch(0.18 0.006 270)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs uppercase tracking-widest" style={{ background: "oklch(0.08 0.013 270)", color: "rgba(100,116,139,0.6)" }}>
                or continue with email
              </span>
            </div>
          </motion.div>

          {/* Email form */}
          <motion.form {...fadeUp(0.25)} onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-11 text-sm"
                style={{ background: "oklch(0.11 0.010 270)", borderColor: "oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "rgba(100,116,139,0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(100,116,139,0.7)")}
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-11 text-sm pr-10"
                  style={{ background: "oklch(0.11 0.010 270)", borderColor: "oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(100,116,139,0.6)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#818cf8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.6)")}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold gap-2 group transition-all duration-200 hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)", color: "white", border: "none" }}
            >
              {loading ? "Signing in…" : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </motion.form>

          <motion.p {...fadeUp(0.35)} className="mt-8 text-center text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>
            By signing in you agree to our{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">Privacy Policy</Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const C = {
    bg: "#0f0f1a",
    surface: "#141421",
    border: "rgba(255,255,255,0.06)",
    text: "#f1f5f9",
    muted: "#64748b",
    accent: "rgba(99,102,241,0.15)",
    accentBorder: "rgba(99,102,241,0.3)",
    red: "#f87171", redBg: "rgba(239,68,68,0.1)", redBorder: "rgba(239,68,68,0.35)",
    green: "#4ade80", greenBg: "rgba(34,197,94,0.1)", greenBorder: "rgba(34,197,94,0.35)",
    amber: "#fbbf24",
  };

  const sparkPoints = [4, 9, 6, 14, 11, 18, 13];
  const spMax = Math.max(...sparkPoints);
  const spW = 200, spH = 32;
  const toX = (i: number) => (i / (sparkPoints.length - 1)) * spW;
  const toY = (v: number) => spH - (v / spMax) * (spH - 4) - 2;
  const linePath = sparkPoints.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${spW},${spH} L0,${spH} Z`;

  return (
    <div className="select-none pointer-events-none text-[10px]" style={{ background: C.bg }}>
      {/* Pill navbar */}
      <div className="relative flex items-center justify-center px-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-0.5 rounded-full px-1 py-0.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
          {[{ l: "Snipe", a: false }, { l: "Dashboard", a: true }, { l: "Assets", a: false }].map(({ l, a }) => (
            <span key={l} className="px-2.5 py-0.5 rounded-full text-[9px] font-medium" style={a ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" } : { color: C.muted }}>{l}</span>
          ))}
        </div>
        <div className="absolute right-3 flex items-center gap-1.5">
          <Bell className="h-3 w-3" style={{ color: C.muted }} />
          <div className="h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>JJ</div>
        </div>
      </div>

      <div className="p-2.5 flex flex-col gap-2">
        {/* Heading */}
        <div>
          <p className="font-bold text-[11px]" style={{ color: C.text }}>Security Overview</p>
          <p className="text-[8px] mt-0.5" style={{ color: C.muted }}>Real-time threat intelligence</p>
        </div>

        {/* Quick scan */}
        <div className="flex gap-1">
          <div className="flex-1 flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Search className="h-2.5 w-2.5 shrink-0" style={{ color: C.muted }} />
            <span className="text-[8px]" style={{ color: "rgba(100,116,139,0.45)" }}>Quick scan — enter an IP or domain…</span>
          </div>
          <div className="rounded-md px-2 py-1 text-[8px] font-medium flex items-center" style={{ background: "rgba(99,102,241,0.85)", color: "white" }}>Scan</div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-6 gap-1">
          {[
            { l: "Scans",   v: "247", c: "#818cf8", ib: C.accent,   ibr: C.accentBorder },
            { l: "Assets",  v: "12",  c: "#818cf8", ib: C.accent,   ibr: C.accentBorder },
            { l: "Ports",   v: "31",  c: "#818cf8", ib: C.accent,   ibr: C.accentBorder },
            { l: "Threats", v: "3",   c: C.red,     ib: C.redBg,    ibr: C.redBorder,   t: "↑+1" },
            { l: "Clean",   v: "211", c: C.green,   ib: C.greenBg,  ibr: C.greenBorder },
            { l: "Alerts",  v: "2",   c: C.red,     ib: C.redBg,    ibr: C.redBorder },
          ].map((k) => (
            <div key={k.l} className="rounded-md p-1.5 flex flex-col gap-0.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="h-4 w-4 rounded flex items-center justify-center" style={{ background: k.ib, border: `1px solid ${k.ibr}` }}>
                <Shield className="h-2 w-2" style={{ color: k.c }} />
              </div>
              <p className="font-bold text-[10px] leading-none mt-0.5" style={{ color: k.c }}>{k.v}</p>
              {k.t && <p className="text-[7px] leading-none" style={{ color: C.amber }}>{k.t}</p>}
              <p className="text-[7px] leading-none" style={{ color: C.muted }}>{k.l}</p>
            </div>
          ))}
        </div>

        {/* Chart + recent scans side by side */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Sparkline */}
          <div className="rounded-md p-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-[8px] font-semibold mb-1.5" style={{ color: C.text }}>Scans / 7d</p>
            <svg width="100%" height={spH} viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#dg2)" />
              <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between mt-0.5 text-[6px]" style={{ color: C.muted }}>
              {["Jun 5", "", "", "", "", "", "Jun 11"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>

          {/* Recent scans */}
          <div className="rounded-md overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-[8px] font-semibold px-2 py-1.5" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }}>Recent Scans</p>
            {[
              { t: "185.220.101.45",  v: "THREAT",     vc: C.red,   vbg: C.redBg,   icon: "ip" },
              { t: "example-corp.com",v: "CLEAN",      vc: C.green, vbg: C.greenBg, icon: "domain" },
              { t: "45.142.212.100",  v: "SUSPICIOUS", vc: C.amber, vbg: "rgba(245,158,11,0.1)", icon: "ip" },
            ].map((row, i, arr) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div className="h-3.5 w-3.5 rounded flex items-center justify-center shrink-0" style={{ background: C.accent, border: `1px solid ${C.accentBorder}` }}>
                  {row.icon === "domain" ? <Globe className="h-2 w-2" style={{ color: "#818cf8" }} /> : <Shield className="h-2 w-2" style={{ color: "#818cf8" }} />}
                </div>
                <span className="flex-1 font-mono text-[7px] truncate" style={{ color: C.text }}>{row.t}</span>
                <span className="text-[7px] font-medium px-1 py-0.5 rounded-full" style={{ color: row.vc, background: row.vbg }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
