"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, Globe, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Severity = "critical" | "high" | "medium" | "low";
type Category = "ip_threat" | "malicious_domain" | "port_risk";

interface Alert {
  id: string;
  user_id: string;
  source_table: string;
  source_record_id: string;
  severity: Severity;
  category: Category;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; border: string; label: string }> = {
  critical: { color: "bg-red-500/10 text-red-500 border-red-500/30", border: "border-l-red-500", label: "Critical" },
  high: { color: "bg-orange-500/10 text-orange-500 border-orange-500/30", border: "border-l-orange-500", label: "High" },
  medium: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", border: "border-l-yellow-500", label: "Medium" },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/30", border: "border-l-blue-500", label: "Low" },
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; label: string }> = {
  ip_threat: { icon: <ShieldAlert className="h-5 w-5" />, label: "IP Threat" },
  malicious_domain: { icon: <Globe className="h-5 w-5" />, label: "Domain" },
  port_risk: { icon: <Terminal className="h-5 w-5" />, label: "Port Scan" },
};

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

function getReScanLink(alert: Alert): string {
  if (alert.category === "ip_threat") {
    const ip = (alert.metadata as { ip_address?: string }).ip_address ?? "";
    return `/lookup?ip=${encodeURIComponent(ip)}`;
  }
  if (alert.category === "malicious_domain") {
    const domain = (alert.metadata as { domain?: string }).domain ?? "";
    return `/domain?domain=${encodeURIComponent(domain)}`;
  }
  if (alert.category === "port_risk") {
    const target = (alert.metadata as { target?: string }).target ?? "";
    return `/ports?target=${encodeURIComponent(target)}`;
  }
  return "#";
}

export default function AlertsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const highlightRef = useRef<HTMLDivElement>(null);
  const hasMarked = useRef(false);

  const highlightId = searchParams.get("highlight");

  // Fetch alerts on mount
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const uid = user.id;
      setUserId(uid);

      supabase
        .from("alerts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setAlerts(data as Alert[]);
          }
          setLoading(false);
        });
    });
  }, [router]);

  // Mark all alerts as read on mount (once)
  useEffect(() => {
    if (hasMarked.current) return;
    if (!userId) return;
    hasMarked.current = true;

    const supabase = createClient();
    (async () => {
      try {
        await supabase
          .from("alerts")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false);
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      } catch {
        // Silently fail
      }
    })();
  }, [userId]);

  // Scroll to highlighted alert
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [highlightId, alerts]);

  // Remove highlight from URL after initial scroll
  useEffect(() => {
    if (highlightId) {
      const timeout = setTimeout(() => {
        router.replace("/alerts", { scroll: false });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, router]);

  const filteredAlerts =
    activeTab === "all"
      ? alerts
      : alerts.filter((a) => a.severity === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Alerts
          {alerts.length > 0 && (
            <span className="ml-2 rounded-md bg-red-500/20 px-2.5 py-0.5 text-sm font-semibold text-red-400 border border-red-500/30">
              {alerts.length}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Security alerts from IP lookups, domain scans, and port scans.
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="high">High</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alert Feed */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sevConfig = SEVERITY_CONFIG[alert.severity];
            const catConfig = CATEGORY_CONFIG[alert.category];
            const isHighlight = alert.id === highlightId;

            return (
              <div
                key={alert.id}
                ref={alert.id === highlightId ? highlightRef : undefined}
                className={`rounded-lg border ${isHighlight ? "bg-primary/10 ring-1 ring-primary" : ""} ${!alert.read && !isHighlight ? "bg-muted/40" : ""}`}
              >
                <Card
                  className={`border-l-4 ${sevConfig.border} ${isHighlight ? "border-border bg-transparent" : "border-border bg-card"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Category icon */}
                        <div className={`mt-0.5 flex-shrink-0 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-orange-500" : "text-yellow-500"}`}>
                          {catConfig.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground truncate">
                              {alert.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${sevConfig.color}`}
                            >
                              {sevConfig.label}
                            </Badge>
                          </div>

                          {alert.message && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {alert.message}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="truncate">{catConfig.label}</span>
                            <span>·</span>
                            <span>{getRelativeTime(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Re-scan link */}
                      <Link
                        href={getReScanLink(alert)}
                        className="flex-shrink-0 text-xs text-primary hover:underline pt-1"
                      >
                        Re-scan
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <ShieldAlert className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {activeTab === "all" ? "No alerts" : `No ${activeTab} alerts`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === "all"
              ? "All your scans are clean. No security alerts to show."
              : `No ${activeTab} severity alerts found.`}
          </p>
        </div>
      )}
    </div>
  );
}