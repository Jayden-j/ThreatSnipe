"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, Globe, Terminal, ChevronRight, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

// ─── Severity config ───────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { accentColor: string; badgeClass: string; iconBgClass: string; label: string }
> = {
  critical: {
    accentColor: "#ef4444",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-400",
    iconBgClass: "bg-red-500/10 text-red-400",
    label: "Critical",
  },
  high: {
    accentColor: "#f97316",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    iconBgClass: "bg-orange-500/10 text-orange-400",
    label: "High",
  },
  medium: {
    accentColor: "#eab308",
    badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    iconBgClass: "bg-yellow-500/10 text-yellow-400",
    label: "Medium",
  },
  low: {
    accentColor: "#3b82f6",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    iconBgClass: "bg-blue-500/10 text-blue-400",
    label: "Low",
  },
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; label: string }> = {
  ip_threat: {
    icon: <ShieldAlert className="h-4 w-4" />,
    label: "IP Threat",
  },
  malicious_domain: {
    icon: <Globe className="h-4 w-4" />,
    label: "Malicious Domain",
  },
  port_risk: {
    icon: <Terminal className="h-4 w-4" />,
    label: "Port Risk",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

// ─── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  index,
  isHighlight,
  alertRef,
}: {
  alert: Alert;
  index: number;
  isHighlight: boolean;
  alertRef?: React.Ref<HTMLDivElement>;
}) {
  const sevCfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;
  const catCfg = CATEGORY_CONFIG[alert.category] ?? CATEGORY_CONFIG.ip_threat;

  return (
    <motion.div
      ref={alertRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.04, 0.28),
        ease: "easeOut",
      }}
      className={cn(
        "group relative rounded-xl border border-border/70 bg-card overflow-hidden",
        isHighlight && "ring-1 ring-primary/40 border-primary/30",
        !alert.read && !isHighlight && "bg-card/80"
      )}
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
    >
      {/* Severity left accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: `linear-gradient(to bottom, ${sevCfg.accentColor}, ${sevCfg.accentColor}66)`,
        }}
      />

      {/* Unread indicator dot */}
      {!alert.read && (
        <div
          className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full"
          style={{ background: sevCfg.accentColor }}
        />
      )}

      <div className="pl-5 pr-5 py-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              sevCfg.iconBgClass
            )}
          >
            {catCfg.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap pr-6">
              <Badge
                variant="outline"
                className={cn("text-[9px] px-1.5 py-0 h-4 shrink-0", sevCfg.badgeClass)}
              >
                {sevCfg.label.toUpperCase()}
              </Badge>
              <p className="font-semibold text-sm text-foreground leading-snug">
                {alert.title}
              </p>
            </div>

            {/* Message */}
            {alert.message && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {alert.message}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{catCfg.label}</span>
                <span className="text-border">·</span>
                <span className="tabular-nums">{getRelativeTime(alert.created_at)}</span>
              </div>

              <Link
                href={getReScanLink(alert)}
                className="flex items-center gap-1 text-[11px] font-medium text-primary/80 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Re-scan
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page content ──────────────────────────────────────────────────────────────

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
          if (data) setAlerts(data as Alert[]);
          setLoading(false);
        });
    });
  }, [router]);

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
        // silently fail
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [highlightId, alerts]);

  useEffect(() => {
    if (highlightId) {
      const timeout = setTimeout(() => {
        router.replace("/alerts", { scroll: false });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, router]);

  const filteredAlerts =
    activeTab === "all" ? alerts : alerts.filter((a) => a.severity === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-foreground">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Alerts
          {alerts.length > 0 && (
            <span className="rounded-md border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-sm font-semibold text-red-400">
              {alerts.length}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Security alerts from IP lookups, domain scans, and port scans.
        </p>
      </div>

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="high">High</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alert feed */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-2.5">
          {filteredAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={index}
              isHighlight={alert.id === highlightId}
              alertRef={alert.id === highlightId ? highlightRef : undefined}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card p-14 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
            <Bell className="h-7 w-7 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === "all" ? "No alerts" : `No ${activeTab} alerts`}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            {activeTab === "all"
              ? "All clear — no security alerts to show."
              : `No ${activeTab} severity alerts found.`}
          </p>
        </motion.div>
      )}
    </div>
  );
}
