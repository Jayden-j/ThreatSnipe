import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScansOverTime } from "@/components/charts/scans-over-time";
import { ThreatBreakdown } from "@/components/charts/threat-breakdown";
import { RecentScansWidget, type RecentScanEntry } from "@/components/recent-scans-widget";
import { AlertsWidget, type AlertEntry } from "@/components/alerts-widget";
import { ToolLauncher } from "@/components/tool-launcher";
import { KpiCard } from "@/components/kpi-card";
import { QuickScanBar } from "@/components/quick-scan-bar";
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  ScanLine,
  Bell,
  FolderKanban,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: scans },
    { data: domainScans },
    { data: portScans },
    { data: assets },
    { data: alerts },
    { data: recentIPs },
    { data: recentDomains },
    { data: recentPorts },
  ] = await Promise.all([
    supabase
      .from("scans")
      .select("threat_level, created_at")
      .eq("user_id", user.id),
    supabase
      .from("domain_scans")
      .select("verdict, created_at")
      .eq("user_id", user.id),
    supabase
      .from("port_scans")
      .select("created_at")
      .eq("user_id", user.id),
    supabase
      .from("assets")
      .select("id, last_status")
      .eq("user_id", user.id),
    supabase
      .from("alerts")
      .select("id, severity, category, title, message, created_at, read")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("scans")
      .select("id, ip_address, threat_level, created_at, abuse_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("domain_scans")
      .select("id, domain, verdict, created_at, malicious")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("port_scans")
      .select("id, target, open_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const ipsScanned = scans?.length ?? 0;
  const domainsScanned = domainScans?.length ?? 0;
  const portsScanned = portScans?.length ?? 0;
  const totalScans = ipsScanned + domainsScanned + portsScanned;

  const ipThreats = scans?.filter((s) => s.threat_level === "THREAT").length ?? 0;
  const domainThreats = domainScans?.filter((s) => s.verdict === "MALICIOUS").length ?? 0;
  const threatsDetected = ipThreats + domainThreats;

  const ipSuspicious = scans?.filter((s) => s.threat_level === "SUSPICIOUS").length ?? 0;
  const domainSuspicious = domainScans?.filter((s) => s.verdict === "SUSPICIOUS").length ?? 0;
  const totalSuspicious = ipSuspicious + domainSuspicious;

  const cleanIps = scans?.filter((s) => s.threat_level === "CLEAN").length ?? 0;

  const assetCount = assets?.length ?? 0;
  const unreadAlerts = alerts?.filter((a) => !a.read).length ?? 0;

  // ── Threat trend (this week vs prior week, in-memory from existing data) ────
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const weekStart = now - sevenDaysMs;
  const twoWeeksStart = now - 2 * sevenDaysMs;

  const ipThreatsThisWeek =
    scans?.filter(
      (s) => s.threat_level === "THREAT" && new Date(s.created_at).getTime() >= weekStart
    ).length ?? 0;
  const ipThreatsLastWeek =
    scans?.filter(
      (s) =>
        s.threat_level === "THREAT" &&
        new Date(s.created_at).getTime() >= twoWeeksStart &&
        new Date(s.created_at).getTime() < weekStart
    ).length ?? 0;
  const domainThreatsThisWeek =
    domainScans?.filter(
      (s) => s.verdict === "MALICIOUS" && new Date(s.created_at).getTime() >= weekStart
    ).length ?? 0;
  const domainThreatsLastWeek =
    domainScans?.filter(
      (s) =>
        s.verdict === "MALICIOUS" &&
        new Date(s.created_at).getTime() >= twoWeeksStart &&
        new Date(s.created_at).getTime() < weekStart
    ).length ?? 0;

  const threatDelta =
    ipThreatsThisWeek + domainThreatsThisWeek - (ipThreatsLastWeek + domainThreatsLastWeek);

  // ── Scans over time (last 7 days) ───────────────────────────────────────────
  const scansOverTime = (() => {
    const grouped: Record<string, number> = {};
    for (const s of [...(scans ?? []), ...(domainScans ?? []), ...(portScans ?? [])]) {
      const date = new Date(s.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: grouped[dateStr] || 0 });
    }
    return result;
  })();

  // ── Recent scans (merged, last 8) ────────────────────────────────────────────
  const recentScans: RecentScanEntry[] = [
    ...(recentIPs ?? []).map((s) => ({
      id: s.id as string,
      type: "ip" as const,
      target: s.ip_address as string,
      verdict: s.threat_level as string,
      summary: `Score: ${s.abuse_score as number}/100`,
      created_at: s.created_at as string,
    })),
    ...(recentDomains ?? []).map((d) => ({
      id: d.id as string,
      type: "domain" as const,
      target: d.domain as string,
      verdict: d.verdict as string,
      summary: `${d.malicious as number} engine${(d.malicious as number) !== 1 ? "s" : ""} flagged`,
      created_at: d.created_at as string,
    })),
    ...(recentPorts ?? []).map((p) => {
      const open = p.open_count as number;
      return {
        id: p.id as string,
        type: "port" as const,
        target: p.target as string,
        verdict: open === 0 ? "CLEAN" : open <= 3 ? "SUSPICIOUS" : "MALICIOUS",
        summary: `${open} open port${open !== 1 ? "s" : ""}`,
        created_at: p.created_at as string,
      };
    }),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const typedAlerts = (alerts ?? []) as AlertEntry[];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Real-time threat intelligence across your infrastructure
        </p>
      </div>

      {/* Quick Scan */}
      <QuickScanBar />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Database} label="Total Scans" value={totalScans} />
        <KpiCard icon={FolderKanban} label="Assets" value={assetCount} />
        <KpiCard icon={ScanLine} label="Ports Scanned" value={portsScanned} />
        <KpiCard
          icon={ShieldAlert}
          label="Threats"
          value={threatsDetected}
          variant={threatsDetected > 0 ? "threat" : "default"}
          trend={{ delta: threatDelta }}
        />
        <KpiCard
          icon={ShieldCheck}
          label="Clean"
          value={cleanIps}
          variant={cleanIps > 0 ? "safe" : "default"}
        />
        <KpiCard
          icon={Bell}
          label="Open Alerts"
          value={unreadAlerts}
          variant={unreadAlerts > 0 ? "threat" : "default"}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
        {/* Left — charts + recent scans */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <ScansOverTime data={scansOverTime} />
          <RecentScansWidget entries={recentScans} />
        </div>

        {/* Right — threat breakdown + alerts */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <ThreatBreakdown
            clean={cleanIps}
            suspicious={totalSuspicious}
            threat={threatsDetected}
          />
          <AlertsWidget alerts={typedAlerts} />
        </div>
      </div>

      {/* Tool Launcher */}
      <ToolLauncher />
    </div>
  );
}
