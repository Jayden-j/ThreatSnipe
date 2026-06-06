import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Globe, Terminal, ArrowRight, Clock } from "lucide-react";

export type RecentScanEntry = {
  id: string;
  type: "ip" | "domain" | "port";
  target: string;
  verdict: string;
  summary: string;
  created_at: string;
};

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function verdictStyle(v: string): string {
  const u = v.toUpperCase();
  if (u === "CLEAN") return "border-green-500/40 bg-green-500/10 text-green-400";
  if (u === "SUSPICIOUS") return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  if (u === "MALICIOUS" || u === "THREAT") return "border-red-500/40 bg-red-500/10 text-red-400";
  return "border-border bg-muted text-muted-foreground";
}

function TypeIcon({ type }: { type: "ip" | "domain" | "port" }) {
  const cls = "h-3.5 w-3.5 text-primary";
  if (type === "ip") return <Shield className={cls} />;
  if (type === "domain") return <Globe className={cls} />;
  return <Terminal className={cls} />;
}

export function RecentScansWidget({ entries }: { entries: RecentScanEntry[] }) {
  return (
    <Card className="border-border/60 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Recent Scans
        </CardTitle>
        <Link
          href="/history"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">No scans yet — run your first scan above</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-6 py-2.5 hover:bg-secondary/40 transition-colors group"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <TypeIcon type={entry.type} />
                </span>
                <span className="flex-1 min-w-0 font-mono text-xs text-foreground truncate">
                  {entry.target}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block shrink-0 max-w-[140px] truncate">
                  {entry.summary}
                </span>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-[10px] px-1.5 py-0 h-5", verdictStyle(entry.verdict))}
                >
                  {entry.verdict}
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0 w-12 text-right tabular-nums">
                  {relTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
