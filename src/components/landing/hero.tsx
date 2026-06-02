"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Bell,
  Search,
  Plus,
  ChevronRight,
  ArrowRight,
  Shield,
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
    accentDim: "rgba(99,102,241,0.15)",
    red: "#ef4444",
    green: "#22c55e",
    amber: "#f59e0b",
  };

  return (
    <div
      className="flex text-[11px] select-none pointer-events-none"
      style={{ minHeight: 360, background: C.bg }}
    >
      {/* Sidebar */}
      <aside
        className="w-44 shrink-0 flex flex-col gap-0.5 px-2 py-3"
        style={{ borderRight: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div
            className="h-5 w-5 rounded flex items-center justify-center"
            style={{ background: C.accentDim, border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <Shield className="h-3 w-3" style={{ color: "#818cf8" }} />
          </div>
          <span className="font-semibold text-[11px]" style={{ color: C.text }}>
            ThreatSnipe
          </span>
          <ChevronDown className="h-3 w-3 ml-auto" style={{ color: C.muted }} />
        </div>

        <NavItem label="Dashboard" active color={C} />
        <NavItem label="Assets" badge="24" color={C} />
        <NavItem label="Alerts" badge="3" badgeRed color={C} />
        <NavItem label="Scan History" color={C} />
        <NavItem label="Lookups" hasChevron color={C} />
        <NavItem label="Blacklists" color={C} />

        <div
          className="mt-3 mb-1 px-2 text-[9px] uppercase tracking-widest font-medium"
          style={{ color: "rgba(100,116,139,0.6)" }}
        >
          Monitors
        </div>
        <NavItem label="IP Watch" color={C} />
        <NavItem label="Domain Watch" color={C} />
        <NavItem label="CIDR Ranges" color={C} />
      </aside>

      {/* Main */}
      <main
        className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.018)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[12px]" style={{ color: C.text }}>
              Welcome back, Jayden
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: C.muted }}>
              Last scan: 2 minutes ago · 0 active threats
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px]"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
            >
              <Search className="h-3 w-3" />
              <span>Search...</span>
              <span
                className="ml-1 text-[9px] rounded px-1 border"
                style={{ borderColor: C.border, color: C.muted }}
              >
                ⌘K
              </span>
            </div>
            <div
              className="rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{
                background: C.accentDim,
                color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              New Scan
            </div>
            <Bell className="h-3.5 w-3.5" style={{ color: C.muted }} />
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center font-semibold text-[9px]"
              style={{
                background: "rgba(99,102,241,0.2)",
                color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              JJ
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-2">
          {[
            { label: "Threat Score", value: "74", sub: "/ 100", badge: "Last 30d", delta: "+2 this week", deltaColor: C.green },
            { label: "Assets", value: "194", sub: "monitored", badge: "↑ 12 this week", delta: "142 IPs · 38 Domains", deltaColor: C.muted },
            { label: "Alerts", value: "3", sub: "active", badge: "High priority", delta: "Last: 4h ago", deltaColor: C.amber },
          ].map((card) => (
            <div
              key={card.label}
              className="flex-1 rounded-xl p-2.5 flex flex-col gap-1"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[10px]" style={{ color: C.text }}>
                  {card.label}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)", color: C.muted }}
                >
                  {card.badge}
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-bold leading-none" style={{ color: C.text }}>
                  {card.value}
                </span>
                <span className="text-[9px] mb-0.5" style={{ color: C.muted }}>
                  {card.sub}
                </span>
              </div>
              <span className="text-[9px]" style={{ color: card.deltaColor }}>
                {card.delta}
              </span>
            </div>
          ))}
        </div>

        {/* Recent scans table */}
        <div
          className="rounded-xl overflow-hidden flex-1"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div
            className="px-3 py-2 font-semibold text-[11px] flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.border}`, color: C.text }}
          >
            <span>Recent Scans</span>
            <Plus className="h-3 w-3" style={{ color: C.muted }} />
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Date", "Target", "Type", "Status"].map((h) => (
                  <th
                    key={h}
                    className={`py-1.5 px-3 font-medium text-[9px] ${h === "Status" ? "text-right" : "text-left"}`}
                    style={{ color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Jun 2", target: "185.220.101.45", type: "IP Scan", status: "Malicious", color: C.red, bg: "rgba(239,68,68,0.1)" },
                { date: "Jun 1", target: "example-domain.com", type: "Domain", status: "Clean", color: C.green, bg: "rgba(34,197,94,0.1)" },
                { date: "Jun 1", target: "192.168.10.0/24", type: "CIDR", status: "Clean", color: C.green, bg: "rgba(34,197,94,0.1)" },
                { date: "May 31", target: "45.142.212.100", type: "IP Scan", status: "Suspicious", color: C.amber, bg: "rgba(245,158,11,0.1)" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <td className="px-3 py-2 text-[9px]" style={{ color: C.muted }}>{row.date}</td>
                  <td className="px-3 py-2 text-[10px] font-mono" style={{ color: C.text }}>{row.target}</td>
                  <td className="px-3 py-2 text-[9px]" style={{ color: C.muted }}>{row.type}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                      style={{ background: row.bg, color: row.color }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  label,
  active,
  badge,
  badgeRed,
  hasChevron,
  color,
}: {
  label: string;
  active?: boolean;
  badge?: string;
  badgeRed?: boolean;
  hasChevron?: boolean;
  color: Record<string, string>;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
      style={{
        background: active ? "rgba(99,102,241,0.15)" : "transparent",
        color: active ? "#a5b4fc" : color.muted,
        border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
      }}
    >
      <span className="flex-1 text-[10px] font-medium">{label}</span>
      {badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{
            background: badgeRed ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
            color: badgeRed ? "#f87171" : color.muted,
          }}
        >
          {badge}
        </span>
      )}
      {hasChevron && <ChevronRight className="h-2.5 w-2.5" />}
    </div>
  );
}
