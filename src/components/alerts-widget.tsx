import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ArrowRight, ShieldAlert, Globe, Terminal } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";
type Category = "ip_threat" | "malicious_domain" | "port_risk";

export type AlertEntry = {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  message: string | null;
  created_at: string;
  read: boolean;
};

const SEV: Record<Severity, { badge: string; dot: string; border: string }> = {
  critical: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-500",
    border: "border-l-red-500",
  },
  high: {
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    dot: "bg-orange-500",
    border: "border-l-orange-500",
  },
  medium: {
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    dot: "bg-yellow-400",
    border: "border-l-yellow-400",
  },
  low: {
    badge: "border-blue-400/30 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
    border: "border-l-blue-400",
  },
};

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CategoryIcon({ cat }: { cat: Category }) {
  if (cat === "ip_threat") return <ShieldAlert className="h-3.5 w-3.5 text-red-400" />;
  if (cat === "malicious_domain") return <Globe className="h-3.5 w-3.5 text-orange-400" />;
  return <Terminal className="h-3.5 w-3.5 text-yellow-400" />;
}

export function AlertsWidget({ alerts }: { alerts: AlertEntry[] }) {
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-primary" />
          Alerts
          {unread > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </CardTitle>
        <Link
          href="/alerts"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Bell className="h-7 w-7 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert) => {
              const sev = SEV[alert.severity] ?? SEV.low;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 border-l-2 px-5 py-3 transition-colors hover:bg-secondary/40",
                    sev.border,
                    !alert.read && "bg-secondary/15"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    <CategoryIcon cat={alert.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] px-1.5 py-0 h-4", sev.badge)}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <p className="text-xs font-medium text-foreground truncate">
                        {alert.title}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {relTime(alert.created_at)}
                    </p>
                  </div>
                  {!alert.read && (
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", sev.dot)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
