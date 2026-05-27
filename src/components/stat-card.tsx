import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  variant?: "default" | "threat" | "safe";
}

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
}: StatCardProps) {
  const glowColor =
    variant === "threat"
      ? "group-hover:border-red-500/50 group-hover:shadow-[0_0_15px_-3px_rgba(255,68,68,0.3)]"
      : variant === "safe"
        ? "group-hover:border-green-500/50 group-hover:shadow-[0_0_15px_-3px_rgba(0,255,136,0.3)]"
        : "group-hover:border-primary/50 group-hover:shadow-[0_0_15px_-3px_rgba(0,255,136,0.3)]";

  return (
    <Card
      className={cn(
        "group border-border bg-card transition-all duration-300",
        glowColor
      )}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
