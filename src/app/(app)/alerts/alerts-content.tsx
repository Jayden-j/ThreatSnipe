"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldAlert,
  Globe,
  Network,
  Ban,
  Lock,
  Server,
  FileSearch,
  Mail,
  Activity,
  Bell,
  BellOff,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  CheckCheck,
  Zap,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";
type CheckType =
  | "ip_lookup"
  | "domain_lookup"
  | "port_scan"
  | "blacklist"
  | "ssl"
  | "dns_records"
  | "whois"
  | "email_security"
  | "server_status";

interface Alert {
  id: string;
  user_id: string;
  asset_id: string | null;
  asset_name: string;
  asset_target: string;
  check_type: CheckType;
  severity: Severity;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    badgeClass: string;
    accentColor: string;
    bgClass: string;
    dotClass: string;
  }
> = {
  critical: {
    label: "Critical",
    badgeClass: "border-red-500/40 bg-red-500/10 text-red-400",
    accentColor: "#ef4444",
    bgClass: "bg-red-500/5",
    dotClass: "bg-red-500",
  },
  high: {
    label: "High",
    badgeClass: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    accentColor: "#f97316",
    bgClass: "bg-orange-500/5",
    dotClass: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    badgeClass: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    accentColor: "#eab308",
    bgClass: "bg-yellow-500/5",
    dotClass: "bg-yellow-400",
  },
  low: {
    label: "Low",
    badgeClass: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    accentColor: "#3b82f6",
    bgClass: "bg-blue-500/5",
    dotClass: "bg-blue-400",
  },
};

const CHECK_TYPE_CONFIG: Record<
  CheckType,
  { label: string; Icon: React.ElementType }
> = {
  ip_lookup: { label: "IP Lookup", Icon: ShieldAlert },
  domain_lookup: { label: "Domain", Icon: Globe },
  port_scan: { label: "Port Scan", Icon: Network },
  blacklist: { label: "Blacklist", Icon: Ban },
  ssl: { label: "SSL", Icon: Lock },
  dns_records: { label: "DNS", Icon: Server },
  whois: { label: "WHOIS", Icon: FileSearch },
  email_security: { label: "Email Security", Icon: Mail },
  server_status: { label: "Server Status", Icon: Activity },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AlertSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-card px-5 py-4">
      <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  index,
  isHighlight,
  cardRef,
  onDelete,
  onMarkRead,
}: {
  alert: Alert;
  index: number;
  isHighlight: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const router = useRouter();
  const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;
  const check = CHECK_TYPE_CONFIG[alert.check_type as CheckType] ?? CHECK_TYPE_CONFIG.ip_lookup;
  const { Icon } = check;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25), ease: "easeOut" }}
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border bg-card px-5 py-4 transition-colors",
        isHighlight
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-border/60 hover:border-border",
        !alert.read && !isHighlight && "border-border/80"
      )}
    >
      {/* Severity accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
        style={{ background: sev.accentColor }}
      />

      {/* Unread dot */}
      {!alert.read && (
        <span
          className={cn(
            "absolute right-4 top-4 h-2 w-2 rounded-full",
            sev.dotClass
          )}
        />
      )}

      {/* Check type icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${sev.accentColor}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: sev.accentColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("h-[18px] px-1.5 text-[9px] font-bold tracking-wide shrink-0", sev.badgeClass)}
          >
            {sev.label.toUpperCase()}
          </Badge>
          <Badge
            variant="outline"
            className="h-[18px] px-1.5 text-[9px] font-medium border-border/50 bg-secondary/40 text-muted-foreground shrink-0"
          >
            {check.label}
          </Badge>
          {alert.asset_name && (
            <span className="text-xs font-semibold text-foreground truncate">
              {alert.asset_name}
            </span>
          )}
          {alert.asset_target && alert.asset_target !== alert.asset_name && (
            <span className="text-[11px] text-muted-foreground/70 font-mono truncate">
              {alert.asset_target}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="mt-1.5 text-sm font-medium text-foreground leading-snug">
          {alert.title}
        </p>

        {/* Message */}
        {alert.message && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {alert.message}
          </p>
        )}

        {/* Footer row */}
        <p className="mt-2 text-[10px] text-muted-foreground/60 tabular-nums">
          {getRelativeTime(alert.created_at)}
        </p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
          aria-label="Alert actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {alert.asset_id && (
            <>
              <DropdownMenuItem
                onClick={() => router.push(`/assets/${alert.asset_id}`)}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View asset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {!alert.read && (
            <DropdownMenuItem
              onClick={() => onMarkRead(alert.id)}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark as read
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onDelete(alert.id)}
            className="flex items-center gap-2 text-red-400 focus:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete alert
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="tabular-nums font-semibold text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

export default function AlertsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isLive, setIsLive] = useState(false);

  const highlightRef = useRef<HTMLDivElement>(null);
  const hasMarked = useRef(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const highlightId = searchParams.get("highlight");

  // ── Fetch alerts ────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setAlerts(data as Alert[]);
          setLoading(false);
        });
    });
  }, [router]);

  // ── Mark all as read on open ─────────────────────────────────────────────
  useEffect(() => {
    if (hasMarked.current || !userId) return;
    hasMarked.current = true;
    const supabase = createClient();
    const run = async () => {
      try {
        await supabase.from("alerts").update({ read: true }).eq("user_id", userId).eq("read", false);
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      } catch {}
    };
    run();
  }, [userId]);

  // ── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`alerts-page-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => [{ ...newAlert, read: true }, ...prev]);
          // mark new alerts read immediately since user is on the page
          supabase.from("alerts").update({ read: true }).eq("id", newAlert.id).then(() => {}).then(undefined, () => {});
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  // ── Scroll to highlight ──────────────────────────────────────────────────
  useEffect(() => {
    if (highlightId && highlightRef.current && !loading) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [highlightId, loading]);

  useEffect(() => {
    if (highlightId) {
      const t = setTimeout(() => router.replace("/alerts", { scroll: false }), 600);
      return () => clearTimeout(t);
    }
  }, [highlightId, router]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const supabase = createClient();
    try { await supabase.from("alerts").delete().eq("id", id); } catch {}
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    const supabase = createClient();
    try { await supabase.from("alerts").update({ read: true }).eq("id", id); } catch {}
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    const supabase = createClient();
    try {
      await supabase.from("alerts").update({ read: true }).eq("user_id", userId).eq("read", false);
    } catch {}
  }, [userId]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredAlerts =
    activeTab === "all"
      ? alerts
      : activeTab === "unread"
      ? alerts.filter((a) => !a.read)
      : alerts.filter((a) => a.severity === activeTab);

  // ── Stats ────────────────────────────────────────────────────────────────
  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-96" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <AlertSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            <Bell className="h-5 w-5 text-primary" strokeWidth={1.8} />
            Alert Feed
            {alerts.length > 0 && (
              <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-sm font-semibold text-muted-foreground">
                {alerts.length}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Threat events from your monitored assets.
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/30 px-3 py-1.5 text-[11px] text-muted-foreground">
          {isLive ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <Zap className="h-3 w-3 text-green-400" />
              <span>Live</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              <span>Connecting…</span>
            </>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <StatChip label="total" value={alerts.length} />
          <Separator orientation="vertical" className="h-3.5" />
          {unreadCount > 0 && (
            <>
              <StatChip
                label="unread"
                value={unreadCount}
                className="text-primary"
              />
              <Separator orientation="vertical" className="h-3.5" />
            </>
          )}
          {criticalCount > 0 && (
            <>
              <StatChip label="critical" value={criticalCount} className="text-red-400" />
              <Separator orientation="vertical" className="h-3.5" />
            </>
          )}
          {highCount > 0 && (
            <StatChip label="high" value={highCount} className="text-orange-400" />
          )}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 gap-0.5 p-0.5">
            <TabsTrigger value="all" className="h-7 px-3 text-xs">
              All
              {alerts.length > 0 && (
                <span className="ml-1.5 rounded bg-secondary px-1 text-[10px] tabular-nums">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="h-7 px-3 text-xs">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded bg-primary/20 px-1 text-[10px] tabular-nums text-primary">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical" className="h-7 px-3 text-xs">
              Critical
            </TabsTrigger>
            <TabsTrigger value="high" className="h-7 px-3 text-xs">
              High
            </TabsTrigger>
            <TabsTrigger value="medium" className="h-7 px-3 text-xs">
              Medium
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Alert list ── */}
      <AnimatePresence mode="popLayout">
        {filteredAlerts.length > 0 ? (
          <div className="space-y-2.5">
            {filteredAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={index}
                isHighlight={alert.id === highlightId}
                cardRef={alert.id === highlightId ? highlightRef : undefined}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card px-8 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-secondary/30">
              {activeTab === "unread" ? (
                <BellOff className="h-6 w-6 text-muted-foreground/50" />
              ) : (
                <Filter className="h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {activeTab === "all"
                ? "No alerts yet"
                : activeTab === "unread"
                ? "All caught up"
                : `No ${activeTab} alerts`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {activeTab === "all"
                ? "Alerts are triggered when asset scans detect threats. Run a check on any asset to get started."
                : activeTab === "unread"
                ? "You have no unread alerts."
                : `No ${activeTab} severity alerts found.`}
            </p>
            {activeTab === "all" && (
              <Link
                href="/assets"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5 gap-1.5 text-xs")}
              >
                <Activity className="h-3.5 w-3.5" />
                View assets
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
