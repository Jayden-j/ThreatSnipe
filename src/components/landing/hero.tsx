"use client";

import { motion } from "framer-motion";
import {
  Play,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" },
  };
}

export function HeroSection() {
  return (
    <section className="relative flex-1 overflow-hidden flex flex-col items-center">
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="relative z-10 flex flex-col items-center w-full px-6 pt-16 md:pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body"
        >
          Now with real-time threat feeds ✨
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-xl"
        >
          The Future of{" "}
          <span className="italic">Smarter</span>
          {" "}Threat Intelligence
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.2)}
          className="mt-4 text-center text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed font-body"
        >
          Monitor IPs, domains, and CIDR ranges with intelligent threat aggregation from AbuseIPDB, VirusTotal, and DNSBL providers—unified into one real-time dashboard.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div {...fadeUp(0.3)} className="mt-5 flex items-center gap-3">
          <Button className="rounded-full px-6 py-5 h-auto text-sm font-medium font-body">
            Book a demo
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80 p-0 flex items-center justify-center"
          >
            <Play className="h-4 w-4 fill-foreground text-foreground" />
          </Button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="mt-8 w-full max-w-5xl"
        >
          <div
            className="rounded-2xl overflow-hidden p-3 md:p-4"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "var(--shadow-dashboard)",
            }}
          >
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div
      className="rounded-xl overflow-hidden bg-background text-[11px] select-none pointer-events-none flex flex-col"
      style={{ minHeight: 380 }}
    >
      {/* Top Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-5 w-5 rounded bg-foreground text-background flex items-center justify-center font-semibold text-[10px]">
            T
          </div>
          <span className="font-semibold text-foreground text-[11px]">ThreatSnipe</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="mx-2 h-4 w-px bg-border" />
        <div className="flex-1 flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-muted-foreground max-w-[180px]">
          <Search className="h-3 w-3" />
          <span>Search...</span>
          <span className="ml-auto text-[9px] bg-background rounded px-1 border border-border">⌘K</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] font-medium">
            New Scan
          </div>
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-[9px]">
            JB
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-40 shrink-0 border-r border-border px-2 py-3 flex flex-col gap-0.5">
          <SidebarItem icon={<Home className="h-3 w-3" />} label="Dashboard" active />
          <SidebarItem label="Assets" badge="24" />
          <SidebarItem label="Alerts" badge="3" badgeRed />
          <SidebarItem label="Scan History" />
          <SidebarItem label="Lookups" hasChevron />
          <SidebarItem label="Blacklists" />
          <SidebarItem label="Settings" />
          <div className="mt-3 mb-1 px-2 text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            Monitors
          </div>
          <SidebarItem label="IP Watch" />
          <SidebarItem label="Domain Watch" />
          <SidebarItem label="CIDR Ranges" />
        </aside>

        {/* Main */}
        <main className="flex-1 p-3 bg-secondary/30 overflow-hidden flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-foreground">Welcome, Jayden</p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <ActionBtn label="Scan IP" primary />
            <ActionBtn label="Check Domain" />
            <ActionBtn label="Bulk Scan" />
            <ActionBtn label="Add Asset" />
            <ActionBtn label="Generate Report" />
            <span className="text-muted-foreground ml-1">Customize</span>
          </div>

          {/* Cards */}
          <div className="flex gap-2.5">
            {/* Threat Score Card */}
            <div className="flex-1 basis-0 rounded-xl bg-background p-3 border border-border flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Threat Score</span>
                <span className="text-[9px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                  Last 30 Days
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-foreground leading-none">74</span>
                <span className="text-muted-foreground text-[9px] mb-0.5">/ 100</span>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span style={{ color: "#16a34a" }}>+12 clean ↑</span>
                <span style={{ color: "#dc2626" }}>-5 threats ↓</span>
              </div>
              <svg viewBox="0 0 300 80" className="h-20 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(239, 84%, 67%)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(239, 84%, 67%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 60 C 20 60, 30 45, 40 45 C 55 45, 65 50, 75 50 C 90 50, 100 20, 110 20 C 125 20, 135 35, 150 35 C 170 35, 180 55, 190 55 C 210 55, 220 40, 230 40 C 260 40, 280 30, 300 30 L 300 80 L 0 80 Z"
                  fill="url(#threatGrad)"
                />
                <path
                  d="M 0 60 C 20 60, 30 45, 40 45 C 55 45, 65 50, 75 50 C 90 50, 100 20, 110 20 C 125 20, 135 35, 150 35 C 170 35, 180 55, 190 55 C 210 55, 220 40, 230 40 C 260 40, 280 30, 300 30"
                  fill="none"
                  stroke="hsl(239, 84%, 67%)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* Assets Card */}
            <div className="flex-1 basis-0 rounded-xl bg-background p-3 border border-border flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">Assets</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Plus className="h-3 w-3" />
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </div>
              <AssetRow label="IP Addresses" value="142" />
              <AssetRow label="Domains" value="38" />
              <AssetRow label="CIDR Ranges" value="12" />
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="rounded-xl bg-background border border-border overflow-hidden">
            <div className="px-3 py-2 font-semibold text-foreground border-b border-border">
              Recent Scans
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-3 py-1.5 font-medium">Date</th>
                  <th className="text-left px-3 py-1.5 font-medium">Target</th>
                  <th className="text-left px-3 py-1.5 font-medium">Type</th>
                  <th className="text-right px-3 py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <ScanRow date="May 31" target="185.220.101.45" type="IP Scan" status="Malicious" statusColor="red" />
                <ScanRow date="May 30" target="example.com" type="Domain Check" status="Clean" statusColor="green" />
                <ScanRow date="May 30" target="192.168.1.0/24" type="CIDR Scan" status="Clean" statusColor="green" />
                <ScanRow date="May 29" target="45.142.212.100" type="IP Scan" status="Suspicious" statusColor="amber" />
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  badge,
  badgeRed,
  hasChevron,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  badgeRed?: boolean;
  hasChevron?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="flex-1 text-[10px] font-medium">{label}</span>
      {badge && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
            badgeRed ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {badge}
        </span>
      )}
      {hasChevron && <ChevronRight className="h-2.5 w-2.5" />}
    </div>
  );
}

function ActionBtn({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <div
      className={`rounded-full px-3 py-1 text-[10px] font-medium ${
        primary
          ? "bg-accent text-accent-foreground"
          : "bg-background border border-border text-foreground"
      }`}
    >
      {label}
    </div>
  );
}

function AssetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-xs border-b border-border last:border-0">
      <span className="text-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function ScanRow({
  date,
  target,
  type,
  status,
  statusColor,
}: {
  date: string;
  target: string;
  type: string;
  status: string;
  statusColor: "red" | "green" | "amber";
}) {
  const colorMap = {
    red: { background: "#fee2e2", color: "#b91c1c" },
    green: { background: "#d1fae5", color: "#065f46" },
    amber: { background: "#fef3c7", color: "#92400e" },
  };
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{date}</td>
      <td className="px-3 py-2 text-foreground" style={{ fontFamily: "monospace", fontSize: 10 }}>
        {target}
      </td>
      <td className="px-3 py-2 text-muted-foreground">{type}</td>
      <td className="px-3 py-2 text-right">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-medium"
          style={colorMap[statusColor]}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}