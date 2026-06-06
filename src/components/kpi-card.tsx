import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: "default" | "threat" | "warning" | "safe";
  trend?: { delta: number };
}

const VARIANT_STYLES = {
  default: {
    icon: "text-primary bg-primary/10 border-primary/20",
    value: "text-foreground",
    border: "border-border/60",
    hover: "hover:border-primary/30 hover:shadow-[0_0_18px_-4px_rgba(99,102,241,0.25)]",
  },
  threat: {
    icon: "text-red-400 bg-red-500/10 border-red-500/20",
    value: "text-red-400",
    border: "border-red-500/20",
    hover: "hover:border-red-500/40 hover:shadow-[0_0_18px_-4px_rgba(239,68,68,0.25)]",
  },
  warning: {
    icon: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    value: "text-yellow-400",
    border: "border-yellow-500/20",
    hover: "hover:border-yellow-500/40 hover:shadow-[0_0_18px_-4px_rgba(234,179,8,0.2)]",
  },
  safe: {
    icon: "text-green-400 bg-green-500/10 border-green-500/20",
    value: "text-green-400",
    border: "border-green-500/20",
    hover: "hover:border-green-500/40 hover:shadow-[0_0_18px_-4px_rgba(34,197,94,0.25)]",
  },
};

export function KpiCard({ icon: Icon, label, value, variant = "default", trend }: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all duration-300",
        styles.border,
        styles.hover
      )}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          styles.icon
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xl font-bold tabular-nums leading-none", styles.value)}>
          {value.toLocaleString()}
        </p>
        {trend !== undefined && (
          <p
            className={cn(
              "mt-0.5 font-mono text-[9px] tabular-nums leading-none",
              trend.delta > 0
                ? "text-orange-400"
                : trend.delta < 0
                ? "text-green-400"
                : "text-muted-foreground/60"
            )}
          >
            {trend.delta > 0
              ? `↑ +${trend.delta} this week`
              : trend.delta < 0
              ? `↓ ${trend.delta} this week`
              : "→ no change"}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
