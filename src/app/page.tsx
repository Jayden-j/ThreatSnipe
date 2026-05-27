import { StatCard } from "@/components/stat-card";
import { Shield, Search, ShieldCheck } from "lucide-react";

export default function Home() {
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
          value={0}
          variant="safe"
        />
        <StatCard
          icon={Shield}
          label="Threats Detected"
          value={0}
          variant="threat"
        />
        <StatCard
          icon={ShieldCheck}
          label="Clean IPs"
          value={0}
          variant="safe"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Run your first IP scan to get started.
        </p>
      </div>
    </div>
  );
}
