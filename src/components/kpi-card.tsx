import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: "default" | "threat" | "warning" | "safe";
}

const VARIANT_STYLES = {
  default: {
    icon: "text-primary bg-primary/10",
    value: "text-foreground",
    border: "border-border",
  },
  threat: {
    icon: "text-red-400 bg-red-500/10",
    value: "text-red-400",
    border: "border-red-500/20",
  },
  warning: {
    icon: "text-yellow-400 bg-yellow-500/10",
    value: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  safe: {
    icon: "text-green-400 bg-green-500/10",
    value: "text-green-400",
    border: "border-green-500/20",
  },
};

export function KpiCard({ icon: Icon, label, value, variant = "default" }: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-secondary/50",
        styles.border
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          styles.icon
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xl font-bold tabular-nums leading-none", styles.value)}>
          {value.toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
