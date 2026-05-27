import { StatCard } from "@/components/stat-card";
import { Shield, Search, ShieldCheck } from "lucide-react";
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

  const totalScans = scans?.length ?? 0;
  const threatsDetected = scans?.filter((s) => s.threat_level === "THREAT").length ?? 0;
  const suspiciousCount = scans?.filter((s) => s.threat_level === "SUSPICIOUS").length ?? 0;
  const cleanIps = scans?.filter((s) => s.threat_level === "CLEAN").length ?? 0;

  // Build scans-over-time data (last 7 days)
  const scansOverTime = (() => {
    if (!scans || scans.length === 0) {
      // Return 7 days with zero counts
      const empty: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        empty.push({ date: d.toISOString().split("T")[0], count: 0 });
      }
      return empty;
    }

    // Group by date
    const grouped: Record<string, number> = {};
    for (const s of scans) {
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
          Welcome to Centry. Run your first IP scan to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Search}
          label="IPs Scanned"
          value={totalScans}
          variant="safe"
        />
        <StatCard
          icon={Shield}
          label="Threats Detected"
          value={threatsDetected}
          variant="threat"
        />
        <StatCard
          icon={ShieldCheck}
          label="Clean IPs"
          value={cleanIps}
          variant="safe"
        />
      </div>

      {totalScans === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Run your first IP scan to get started.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScansOverTime data={scansOverTime} />
        <ThreatBreakdown
          clean={cleanIps}
          suspicious={suspiciousCount}
          threat={threatsDetected}
        />
      </div>
    </div>
  );
}
