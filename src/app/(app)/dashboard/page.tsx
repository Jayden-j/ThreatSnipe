import { StatCard } from "@/components/stat-card";
import {
  Search,
  ShieldCheck,
  Globe,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScansOverTime } from "@/components/charts/scans-over-time";
import { ThreatBreakdown } from "@/components/charts/threat-breakdown";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("threat_level, created_at")
    .eq("user_id", user.id);

  const { data: domainScans } = await supabase
    .from("domain_scans")
    .select("verdict, created_at")
    .eq("user_id", user.id);

  const { data: portScans } = await supabase
    .from("port_scans")
    .select("created_at")
    .eq("user_id", user.id);

  const ipsScanned = scans?.length ?? 0;
  const threatsDetected = scans?.filter((s) => s.threat_level === "THREAT").length ?? 0;
  const suspiciousCount = scans?.filter((s) => s.threat_level === "SUSPICIOUS").length ?? 0;
  const cleanIps = scans?.filter((s) => s.threat_level === "CLEAN").length ?? 0;

  const domainsScanned = domainScans?.length ?? 0;
  const maliciousDomains = domainScans?.filter((s) => s.verdict === "MALICIOUS").length ?? 0;
  const suspiciousDomains = domainScans?.filter((s) => s.verdict === "SUSPICIOUS").length ?? 0;

  const portsScanned = portScans?.length ?? 0;

  const totalThreats = threatsDetected + maliciousDomains;
  const totalSuspicious = suspiciousCount + suspiciousDomains;

  // Build scans-over-time data (last 7 days) from all three tables
  const scansOverTime = (() => {
    const hasAnyData =
      (scans && scans.length > 0) ||
      (domainScans && domainScans.length > 0) ||
      (portScans && portScans.length > 0);

    if (!hasAnyData) {
      const empty: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        empty.push({ date: d.toISOString().split("T")[0], count: 0 });
      }
      return empty;
    }

    // Group by date across all tables
    const grouped: Record<string, number> = {};

    for (const s of scans ?? []) {
      const date = new Date(s.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    for (const s of domainScans ?? []) {
      const date = new Date(s.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    for (const s of portScans ?? []) {
      const date = new Date(s.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    // Fill in last 7 days
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: grouped[dateStr] || 0 });
    }

    return result;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your security operations center. Monitor IPs, domains, and open ports.
        </p>
      </div>

      {/* Row 1: Scans by type */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Search}
          label="IPs Scanned"
          value={ipsScanned}
          variant="safe"
        />
        <StatCard
          icon={Globe}
          label="Domains Scanned"
          value={domainsScanned}
          variant="default"
        />
        <StatCard
          icon={ScanLine}
          label="Ports Scanned"
          value={portsScanned}
          variant="default"
        />
      </div>

      {/* Row 2: Threat summary */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <StatCard
          icon={ShieldAlert}
          label="Threats Detected"
          value={totalThreats}
          variant="threat"
          className={totalThreats > 0 ? "shadow-red-500/20 shadow-lg" : ""}
        />
        <StatCard
          icon={ShieldCheck}
          label="Clean IPs"
          value={cleanIps}
          variant="safe"
          className={cleanIps > 0 ? "shadow-green-500/20 shadow-lg" : ""}
        />
      </div>

      {ipsScanned === 0 && domainsScanned === 0 && portsScanned === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Run your first scan to get started.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScansOverTime data={scansOverTime} />
        <ThreatBreakdown
          clean={cleanIps}
          suspicious={totalSuspicious}
          threat={totalThreats}
        />
      </div>
    </div>
  );
}