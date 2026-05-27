import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldAlert, AlertTriangle, FileWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ThreatLevel = "CLEAN" | "SUSPICIOUS" | "THREAT";

interface Scan {
  id: string;
  ip_address: string;
  abuse_score: number;
  country: string;
  isp: string;
  total_reports: number;
  last_reported: string | null;
  threat_level: ThreatLevel;
  created_at: string;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user.id)
    .eq("threat_level", "THREAT")
    .order("created_at", { ascending: false });

  const alerts = (scans ?? []) as Scan[];
  const alertCount = alerts.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Alerts
          {alertCount > 0 && (
            <span className="ml-2 rounded-md bg-red-500/20 px-2.5 py-0.5 text-sm font-semibold text-red-400 border border-red-500/30">
              {alertCount}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          High-risk IPs flagged from your scan history.
        </p>
      </div>

      {alertCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            No threats detected
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All your scanned IPs are clean or low-risk.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-l-4 border-l-red-500 border-border bg-zinc-900"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        {alert.ip_address}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Country: <span className="text-foreground">{alert.country}</span>
                        </span>
                        <span>
                          ISP: <span className="text-foreground">{alert.isp}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-500">
                    {alert.abuse_score}/100
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <FileWarning className="h-4 w-4" />
                    {alert.total_reports} report{alert.total_reports === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground">
                    Last reported: {formatDate(alert.last_reported)}
                  </span>
                  <span className="text-muted-foreground">
                    Scanned {getRelativeTime(alert.created_at)}
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link href={`/lookup?ip=${alert.ip_address}`}>
                    <Button variant="outline" size="sm">
                      Re-scan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}