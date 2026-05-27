import { StatCard } from "@/components/stat-card";
import { Shield, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("threat_level")
    .eq("user_id", user.id);

  const totalScans = scans?.length ?? 0;
  const threatsDetected = scans?.filter((s) => s.threat_level === "THREAT").length ?? 0;
  const cleanIps = scans?.filter((s) => s.threat_level === "CLEAN").length ?? 0;

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
    </div>
  );
}
