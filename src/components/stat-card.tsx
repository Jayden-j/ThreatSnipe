import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  variant?: "default" | "threat" | "safe";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  className,
}: StatCardProps) {
  const glowColor =
    variant === "threat"
      ? "group-hover:border-red-500/40 group-hover:shadow-[0_0_20px_-4px_rgba(239,68,68,0.35)]"
      : variant === "safe"
        ? "group-hover:border-green-500/40 group-hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.3)]"
        : "group-hover:border-primary/40 group-hover:shadow-[0_0_20px_-4px_rgba(99,102,241,0.3)]";

  return (
    <Card
      className={cn(
        "group border-border bg-card transition-all duration-300",
        glowColor,
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
