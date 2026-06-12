"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Bell,
  Search,
  ChevronRight,
  ArrowRight,
  Shield,
  Globe,
} from "lucide-react";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  };
}

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      className="relative flex flex-col items-center pt-32 pb-0 overflow-hidden"
      style={{ minHeight: "100dvh" }}
      aria-label="Hero"
    >
      {/* Animated gradient orbs */}
      <OrbBackground prefersReduced={!!prefersReduced} />

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.22) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium font-body"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0"
            style={{ boxShadow: "0 0 6px #818cf8" }}
            aria-hidden="true"
          />
          Powered by AbuseIPDB · VirusTotal · 20+ DNSBL providers
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.15)}
          className="font-display text-5xl sm:text-6xl md:text-[5.25rem] lg:text-[6rem] leading-[1] tracking-tight text-white"
        >
          Know every threat,
          <br />
          <span className="italic" style={{ color: "#a5b4fc" }}>
            before it strikes.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.25)}
          className="mt-6 text-base md:text-lg text-slate-400 max-w-[640px] leading-relaxed font-body"
        >
          ThreatSnipe aggregates intelligence from AbuseIPDB, VirusTotal, and 20+ DNSBL
          blacklist providers — giving your security team real-time visibility across every
          IP, domain, and network range you own.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.35)} className="mt-8 flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full font-body transition-all duration-200 hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
              color: "white",
            }}
          >
            Start Monitoring Free
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 font-body group"
          >
            See how it works
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          {...fadeUp(0.45)}
          className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-body"
        >
          <Shield className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          No credit card required · Free tier available · Deploy in under 60 seconds
        </motion.div>
      </div>

      {/* Dashboard mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.55, ease: "easeOut" }}
        className="relative z-10 mt-14 w-full max-w-5xl px-6 mx-auto"
      >
        {/* Outer glow frame */}
        <div
          className="rounded-2xl p-px"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 50%, rgba(99,102,241,0.1) 100%)",
          }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0f0f1a" }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              </div>
              <div
                className="flex-1 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono rounded-md max-w-[220px] mx-auto px-3 py-1"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                app.threatsnipe.io/dashboard
              </div>
            </div>

            <DashboardPreview />
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #0b0b14)",
          }}
          aria-hidden="true"
        />
      </motion.div>
    </section>
  );
}

function OrbBackground({ prefersReduced }: { prefersReduced: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute rounded-full"
        style={{
          top: "-10%",
          right: "-5%",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.08) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
        animate={
          prefersReduced
            ? undefined
            : { x: [0, 40, -15, 0], y: [0, -25, 20, 0], scale: [1, 1.1, 0.93, 1] }
        }
        transition={
          prefersReduced
            ? undefined
            : { duration: 14, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: "5%",
          left: "-8%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)",
          filter: "blur(80px)",
        }}
        animate={
          prefersReduced
            ? undefined
            : { x: [0, -35, 20, 0], y: [0, 20, -30, 0], scale: [1, 0.92, 1.08, 1] }
        }
        transition={
          prefersReduced
            ? undefined
            : { duration: 18, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 300,
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}

function DashboardPreview() {
  const C = {
    bg: "#0f0f1a",
    surface: "#141421",
    border: "rgba(255,255,255,0.06)",
    text: "#f1f5f9",
    muted: "#64748b",
    accent: "rgba(99,102,241,0.15)",
    accentBorder: "rgba(99,102,241,0.3)",
    red: "#f87171",
    redBg: "rgba(239,68,68,0.1)",
    redBorder: "rgba(239,68,68,0.35)",
    green: "#4ade80",
    greenBg: "rgba(34,197,94,0.1)",
    greenBorder: "rgba(34,197,94,0.35)",
    amber: "#fbbf24",
    amberBg: "rgba(245,158,11,0.1)",
    amberBorder: "rgba(245,158,11,0.35)",
  };

  // Sparkline data points (7-day scan counts)
  const sparkPoints = [4, 9, 6, 14, 11, 18, 13];
  const spMax = Math.max(...sparkPoints);
  const spW = 160, spH = 36;
  const toX = (i: number) => (i / (sparkPoints.length - 1)) * spW;
  const toY = (v: number) => spH - (v / spMax) * (spH - 4) - 2;
  const linePath = sparkPoints.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${spW},${spH} L0,${spH} Z`;

  // Donut arc helper
  function donutArc(startDeg: number, endDeg: number, r = 22, cx = 28, cy = 28) {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  // clean=211, suspicious=18, threat=3 → total=232
  const total = 232, clean = 211, suspicious = 18, threat = 3;
  const cleanDeg = (clean / total) * 360;
  const suspDeg = (suspicious / total) * 360;

  return (
    <div
      className="flex flex-col text-[11px] select-none pointer-events-none"
      style={{ background: C.bg }}
    >
      {/* ── Pill navbar ── */}
      <div className="relative flex items-center justify-center px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div
          className="flex items-center gap-0.5 rounded-full px-1.5 py-1"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}
        >
          {[
            { label: "Snipe", active: false },
            { label: "Dashboard", active: true },
            { label: "Assets", active: false },
          ].map(({ label, active }) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full text-[10px] font-medium"
              style={active ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                           : { color: C.muted }}
            >
              {label}
            </span>
          ))}
        </div>
        {/* Right controls */}
        <div className="absolute right-4 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5" style={{ color: C.muted }} />
          <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}` }}>
            <div className="h-2 w-2 rounded-full" style={{ background: C.muted }} />
          </div>
          <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
            JJ
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="p-3 flex flex-col gap-2.5">

        {/* Header */}
        <div>
          <p className="font-bold text-[13px] leading-none" style={{ color: C.text }}>Security Overview</p>
          <p className="text-[9px] mt-1" style={{ color: C.muted }}>Real-time threat intelligence across your infrastructure</p>
        </div>

        {/* Quick scan bar */}
        <div className="flex gap-1.5">
          <div className="flex-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Search className="h-3 w-3 shrink-0" style={{ color: C.muted }} />
            <span className="text-[9px]" style={{ color: "rgba(100,116,139,0.5)" }}>Quick scan — enter an IP or domain and press Enter…</span>
          </div>
          <div className="rounded-lg px-3 py-1.5 text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.9)", color: "white" }}>Scan</div>
        </div>

        {/* KPI cards — 6 across */}
        <div className="grid grid-cols-6 gap-1.5">
          {[
            { label: "Total Scans", value: "247", color: "#818cf8", iconBg: "rgba(99,102,241,0.15)", iconBorder: "rgba(99,102,241,0.3)" },
            { label: "Assets",      value: "12",  color: "#818cf8", iconBg: "rgba(99,102,241,0.15)", iconBorder: "rgba(99,102,241,0.3)" },
            { label: "Ports",       value: "31",  color: "#818cf8", iconBg: "rgba(99,102,241,0.15)", iconBorder: "rgba(99,102,241,0.3)" },
            { label: "Threats",     value: "3",   color: C.red,    iconBg: C.redBg, iconBorder: C.redBorder, trend: "↑ +1 this week" },
            { label: "Clean",       value: "211", color: C.green,  iconBg: C.greenBg, iconBorder: C.greenBorder },
            { label: "Alerts",      value: "2",   color: C.red,    iconBg: C.redBg, iconBorder: C.redBorder },
          ].map((card) => (
            <div key={card.label} className="rounded-lg p-2 flex items-center gap-1.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center" style={{ background: card.iconBg, border: `1px solid ${card.iconBorder}` }}>
                <Shield className="h-3 w-3" style={{ color: card.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold leading-none text-[11px]" style={{ color: card.color }}>{card.value}</p>
                {card.trend && <p className="text-[8px] leading-none mt-0.5" style={{ color: C.amber }}>{card.trend}</p>}
                <p className="text-[8px] leading-none mt-0.5 truncate" style={{ color: C.muted }}>{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid: 5+3 columns */}
        <div className="grid gap-2" style={{ gridTemplateColumns: "5fr 3fr" }}>

          {/* Left col */}
          <div className="flex flex-col gap-2">
            {/* Scans over time */}
            <div className="rounded-lg p-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold" style={{ color: C.text }}>Scans Over Time</p>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: C.muted }}>Last 7 days</span>
              </div>
              {/* Y labels + chart */}
              <div className="flex items-end gap-1">
                <div className="flex flex-col justify-between text-[7px] pr-1 self-stretch" style={{ color: C.muted }}>
                  <span>18</span>
                  <span>9</span>
                  <span>0</span>
                </div>
                <svg width="100%" height={spH} viewBox={`0 0 ${spW} ${spH}`} preserveAspectRatio="none" className="flex-1">
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#sg)" />
                  <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" />
                  {sparkPoints.map((v, i) => (
                    <circle key={i} cx={toX(i)} cy={toY(v)} r="2" fill="#818cf8" />
                  ))}
                </svg>
              </div>
              {/* X labels */}
              <div className="flex justify-between mt-1 text-[7px]" style={{ color: C.muted }}>
                {["Jun 5", "Jun 6", "Jun 7", "Jun 8", "Jun 9", "Jun 10", "Jun 11"].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>

            {/* Recent scans */}
            <div className="rounded-lg overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-[10px] font-semibold" style={{ color: C.text }}>Recent Scans</p>
                <span className="text-[8px]" style={{ color: C.muted }}>View all →</span>
              </div>
              {[
                { icon: "ip",     target: "185.220.101.45",  summary: "Score: 87/100",       verdict: "THREAT",     vc: C.red,   vbg: C.redBg,   vb: C.redBorder,   time: "2m" },
                { icon: "domain", target: "example-corp.com",summary: "0 engines flagged",   verdict: "CLEAN",      vc: C.green, vbg: C.greenBg, vb: C.greenBorder, time: "1h" },
                { icon: "port",   target: "10.0.0.1",        summary: "4 open ports",        verdict: "SUSPICIOUS", vc: C.amber, vbg: C.amberBg, vb: C.amberBorder, time: "3h" },
                { icon: "ip",     target: "45.142.212.100",  summary: "Score: 14/100",       verdict: "CLEAN",      vc: C.green, vbg: C.greenBg, vb: C.greenBorder, time: "1d" },
              ].map((row, i, arr) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center" style={{ background: C.accent, border: `1px solid ${C.accentBorder}` }}>
                    {row.icon === "domain" ? <Globe className="h-2.5 w-2.5" style={{ color: "#818cf8" }} />
                      : row.icon === "port" ? <ChevronRight className="h-2.5 w-2.5" style={{ color: "#818cf8" }} />
                      : <Shield className="h-2.5 w-2.5" style={{ color: "#818cf8" }} />}
                  </div>
                  <span className="flex-1 font-mono text-[9px] truncate" style={{ color: C.text }}>{row.target}</span>
                  <span className="text-[8px] hidden sm:block truncate max-w-[80px]" style={{ color: C.muted }}>{row.summary}</span>
                  <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ color: row.vc, background: row.vbg, border: `1px solid ${row.vb}` }}>{row.verdict}</span>
                  <span className="text-[8px] w-6 text-right shrink-0" style={{ color: C.muted }}>{row.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-2">
            {/* Threat breakdown donut */}
            <div className="rounded-lg p-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <p className="text-[10px] font-semibold mb-2" style={{ color: C.text }}>Threat Breakdown</p>
              <div className="flex items-center gap-3">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  {/* Clean arc */}
                  <path d={donutArc(0, cleanDeg)} fill="none" stroke={C.green} strokeWidth="9" strokeLinecap="round" opacity="0.8" />
                  {/* Suspicious arc */}
                  <path d={donutArc(cleanDeg, cleanDeg + suspDeg)} fill="none" stroke={C.amber} strokeWidth="9" strokeLinecap="round" opacity="0.8" />
                  {/* Threat arc */}
                  <path d={donutArc(cleanDeg + suspDeg, 360)} fill="none" stroke={C.red} strokeWidth="9" strokeLinecap="round" opacity="0.8" />
                  <text x="28" y="29.5" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: C.text, fontWeight: 700 }}>91%</text>
                  <text x="28" y="38" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 6, fill: C.muted }}>clean</text>
                </svg>
                <div className="flex flex-col gap-1 text-[9px]">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: C.green }} /><span style={{ color: C.muted }}>Clean</span><span className="ml-auto font-medium" style={{ color: C.text }}>211</span></div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: C.amber }} /><span style={{ color: C.muted }}>Suspicious</span><span className="ml-auto font-medium" style={{ color: C.text }}>18</span></div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: C.red }} /><span style={{ color: C.muted }}>Threat</span><span className="ml-auto font-medium" style={{ color: C.text }}>3</span></div>
                </div>
              </div>
            </div>

            {/* Alerts widget */}
            <div className="rounded-lg overflow-hidden flex-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-[10px] font-semibold" style={{ color: C.text }}>Open Alerts</p>
              </div>
              {[
                { title: "Malicious IP detected", asset: "185.220.101.45", sev: "HIGH",   sc: C.red,   sb: C.redBg   },
                { title: "Blacklist hit",          asset: "45.142.212.100", sev: "MEDIUM", sc: C.amber, sb: C.amberBg },
              ].map((a, i, arr) => (
                <div key={i} className="px-3 py-2" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[9px] font-medium leading-snug" style={{ color: C.text }}>{a.title}</p>
                    <span className="text-[7px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold" style={{ background: a.sb, color: a.sc }}>{a.sev}</span>
                  </div>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: C.muted }}>{a.asset}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tool launcher */}
        <div className="rounded-lg p-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-[10px] font-semibold mb-2" style={{ color: C.text }}>Quick Launch</p>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { name: "Abuse Checker",  desc: "IP reputation" },
              { name: "VirusTotal",     desc: "Malware scan" },
              { name: "Port Scanner",   desc: "TCP recon" },
              { name: "Blacklist",      desc: "40+ DNSBLs" },
              { name: "DNS Records",    desc: "Full lookup" },
              { name: "WHOIS",          desc: "Reg. data" },
              { name: "SSL Checker",    desc: "Cert check" },
              { name: "Email Security", desc: "SPF/DKIM" },
              { name: "Server Status",  desc: "Health check" },
              { name: "Bulk Check",     desc: "Batch 20+" },
            ].map((tool) => (
              <div key={tool.name} className="rounded-lg p-1.5 flex flex-col gap-1" style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: C.accent, border: `1px solid ${C.accentBorder}` }}>
                  <Shield className="h-2.5 w-2.5" style={{ color: "#818cf8" }} />
                </div>
                <p className="text-[8px] font-semibold leading-snug" style={{ color: C.text }}>{tool.name}</p>
                <p className="text-[7px] leading-snug" style={{ color: C.muted }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
