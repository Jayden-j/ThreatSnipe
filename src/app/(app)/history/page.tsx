"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import gsap from "gsap";
import { downloadCSV } from "@/lib/csv";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Globe,
  Terminal,
  ChevronDown,
  History,
  Search,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ToolType = "ip_lookup" | "domain" | "port_scan";

interface HistoryEntry {
  id: string;
  tool_type: ToolType;
  target: string;
  summary: string;
  verdict: string;
  created_at: string;
  raw: Record<string, unknown>;
}

type TabValue = "all" | ToolType;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function verdictColor(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v === "CLEAN") return "border-green-500/50 bg-green-500/10 text-green-500";
  if (v === "SUSPICIOUS") return "border-yellow-500/50 bg-yellow-500/10 text-yellow-500";
  if (v === "MALICIOUS" || v === "THREAT")
    return "border-red-500/50 bg-red-500/10 text-red-500";
  return "border-border bg-muted text-muted-foreground";
}

function toolIcon(tool: ToolType, className = "h-4 w-4") {
  switch (tool) {
    case "ip_lookup":
      return <Shield className={cn(className, "text-primary")} />;
    case "domain":
      return <Globe className={cn(className, "text-primary")} />;
    case "port_scan":
      return <Terminal className={cn(className, "text-primary")} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Domain pie chart colours                                           */
/* ------------------------------------------------------------------ */
const DOMAIN_PIE_COLORS: Record<string, string> = {
  Malicious: "#ef4444",
  Suspicious: "#eab308",
  Harmless: "#22c55e",
  Undetected: "#6b7280",
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ScanHistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const [scansRes, domainRes, portRes] = await Promise.all([
      supabase
        .from("scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("domain_scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("port_scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const mapped: HistoryEntry[] = [];

    // IP lookups
    for (const s of scansRes.data ?? []) {
      const score = (s as Record<string, unknown>).abuse_score as number;
      mapped.push({
        id: (s as Record<string, unknown>).id as string,
        tool_type: "ip_lookup",
        target: (s as Record<string, unknown>).ip_address as string,
        summary: `Abuse score: ${score}/100`,
        verdict: (s as Record<string, unknown>).threat_level as string,
        created_at: (s as Record<string, unknown>).created_at as string,
        raw: s as Record<string, unknown>,
      });
    }

    // Domain scans
    for (const d of domainRes.data ?? []) {
      const malicious = (d as Record<string, unknown>).malicious as number;
      const suspicious = (d as Record<string, unknown>).suspicious as number;
      const harmless = (d as Record<string, unknown>).harmless as number;
      const undetected = (d as Record<string, unknown>).undetected as number;
      const total = malicious + suspicious + harmless + undetected;
      mapped.push({
        id: (d as Record<string, unknown>).id as string,
        tool_type: "domain",
        target: (d as Record<string, unknown>).domain as string,
        summary: `${malicious + suspicious}/${total} engines flagged`,
        verdict: (d as Record<string, unknown>).verdict as string,
        created_at: (d as Record<string, unknown>).created_at as string,
        raw: d as Record<string, unknown>,
      });
    }

    // Port scans
    for (const p of portRes.data ?? []) {
      const openCount = (p as Record<string, unknown>).open_count as number;
      const closedCount = (p as Record<string, unknown>).closed_count as number;
      const filteredCount = (p as Record<string, unknown>)
        .filtered_count as number;
      const derivedVerdict =
        openCount === 0 ? "CLEAN" : openCount <= 3 ? "SUSPICIOUS" : "MALICIOUS";
      mapped.push({
        id: (p as Record<string, unknown>).id as string,
        tool_type: "port_scan",
        target: (p as Record<string, unknown>).target as string,
        summary: `${openCount} open ports`,
        verdict: derivedVerdict,
        created_at: (p as Record<string, unknown>).created_at as string,
        raw: p as Record<string, unknown>,
      });
    }

    // Sort by created_at desc (already sorted per-table, but merge order)
    mapped.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setEntries(mapped);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filtered =
    activeTab === "all"
      ? entries
      : entries.filter((e) => e.tool_type === activeTab);

  /* ---- Empty state ---- */
  if (!loading && entries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <History className="h-6 w-6 text-primary" />
            Scan History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all your past scans in one place.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="mb-1 text-lg font-semibold text-foreground">
            No scans yet
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Run your first scan to see history here.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push("/lookup")}>
              <Search className="mr-2 h-4 w-4" />
              IP Lookup
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/domain")}
            >
              <Globe className="mr-2 h-4 w-4" />
              Domain Lookup
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/ports")}
            >
              <Terminal className="mr-2 h-4 w-4" />
              Port Scanner
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <History className="h-6 w-6 text-primary" />
            Scan History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all your past scans in one place.
          </p>
        </div>
        {!loading && entries.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              const rows = filtered.map((e) => ({
                Tool:
                  e.tool_type === "ip_lookup"
                    ? "IP Lookup"
                    : e.tool_type === "domain"
                      ? "Domain"
                      : "Port Scan",
                Target: e.target,
                Verdict: e.verdict,
                Summary: e.summary,
                Date: new Date(e.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              }));
              downloadCSV(rows, `scan-history-${new Date().toISOString().split("T")[0]}.csv`);
            }}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Tabs filter */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabValue);
          setExpandedId(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ip_lookup">IP Lookup</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="port_scan">Port Scan</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      )}

      {/* Entries */}
      {!loading && (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <ScanHistoryRow
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ScanHistoryRow — GSAP-animated expand/collapse                     */
/* ------------------------------------------------------------------ */

interface ScanHistoryRowProps {
  entry: HistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function ScanHistoryRow({ entry, isExpanded, onToggle }: ScanHistoryRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || !chevronRef.current) return;

    if (isOpen) {
      gsap.killTweensOf(contentRef.current);
      gsap.fromTo(
        contentRef.current,
        { maxHeight: 0, opacity: 0 },
        { maxHeight: 1000, opacity: 1, duration: 0.60, ease: "power2.out" }
      );
      gsap.to(chevronRef.current, {
        rotation: 180,
        duration: 0.35,
        ease: "power1.inOut",
      });
    } else {
      gsap.killTweensOf(contentRef.current);
      gsap.to(contentRef.current, {
        maxHeight: 0,
        opacity: 0,
        duration: 0.65,
        ease: "power2.in",
      });
      gsap.to(chevronRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggle();
  };

  return (
    <div>
      {/* Trigger row */}
      <div
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer",
          "border-border bg-card hover:bg-secondary/50",
          isExpanded && "rounded-b-none border-b-0"
        )}
      >
        {/* Icon */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          {toolIcon(entry.tool_type, "h-4 w-4")}
        </span>

        {/* Target */}
        <span className="min-w-0 flex-1 font-mono text-sm font-medium text-foreground truncate">
          {entry.target}
        </span>

        {/* Summary (desktop) */}
        <span className="hidden text-sm text-muted-foreground sm:inline truncate max-w-[220px]">
          {entry.summary}
        </span>

        {/* Verdict badge */}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 px-2.5 py-0.5 text-xs font-semibold",
            verdictColor(entry.verdict)
          )}
        >
          {entry.verdict}
        </Badge>

        {/* Relative time */}
        <span className="hidden text-xs text-muted-foreground shrink-0 md:inline w-16 text-right">
          {relativeTime(entry.created_at)}
        </span>

        {/* Chevron */}
        <div ref={chevronRef}>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>

      {/* Animated content panel */}
      <div
        ref={contentRef}
        style={{ overflow: "hidden", maxHeight: 0, opacity: 0 }}
      >
        <div className="rounded-b-lg border border-t-0 border-border bg-card px-4 pb-4 pt-2">
          {entry.tool_type === "ip_lookup" && (
            <IPLookupDetail raw={entry.raw} />
          )}
          {entry.tool_type === "domain" && (
            <DomainDetail raw={entry.raw} />
          )}
          {entry.tool_type === "port_scan" && (
            <PortScanDetail raw={entry.raw} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded detail: IP Lookup                                         */
/* ------------------------------------------------------------------ */

function IPLookupDetail({ raw }: { raw: Record<string, unknown> }) {
  const score = raw.abuse_score as number;
  const country = (raw.country as string) || "—";
  const isp = (raw.isp as string) || "—";
  const totalReports = (raw.total_reports as number) ?? 0;
  const lastReported = (raw.last_reported as string) || "Never";

  const progressColor =
    score < 15
      ? "bg-green-500"
      : score <= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-4 pt-2">
      {/* Abuse score progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Abuse Score</span>
          <span
            className={cn(
              "font-semibold",
              score < 15
                ? "text-green-500"
                : score <= 50
                  ? "text-yellow-500"
                  : "text-red-500"
            )}
          >
            {score}/100
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <MiniCard label="Country" value={country} />
        <MiniCard label="ISP" value={isp} />
        <MiniCard label="Total Reports" value={String(totalReports)} />
        <MiniCard
          label="Last Reported"
          value={
            lastReported !== "Never" && lastReported !== "—"
              ? new Date(lastReported).toLocaleDateString()
              : "Never"
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded detail: Domain                                             */
/* ------------------------------------------------------------------ */

function DomainDetail({ raw }: { raw: Record<string, unknown> }) {
  const malicious = (raw.malicious as number) ?? 0;
  const suspicious = (raw.suspicious as number) ?? 0;
  const harmless = (raw.harmless as number) ?? 0;
  const undetected = (raw.undetected as number) ?? 0;
  const reputation = (raw.reputation as number) ?? 0;
  const categories = (raw.categories as string[]) ?? [];
  const lastAnalysis = (raw.last_analysis_date as string) || "—";

  const pieData = [
    { name: "Malicious", value: malicious, color: DOMAIN_PIE_COLORS.Malicious },
    { name: "Suspicious", value: suspicious, color: DOMAIN_PIE_COLORS.Suspicious },
    { name: "Harmless", value: harmless, color: DOMAIN_PIE_COLORS.Harmless },
    { name: "Undetected", value: undetected, color: DOMAIN_PIE_COLORS.Undetected },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
      {/* Pie chart */}
      <Card className="border-border bg-secondary/30">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Detection Breakdown
          </p>
          {pieData.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              No data
            </div>
          )}
          {/* Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {d.name}: {d.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">Reputation</span>
          <span
            className={cn(
              "text-sm font-semibold",
              reputation > 0
                ? "text-green-500"
                : reputation < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
            )}
          >
            {reputation}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">Malicious</span>
          <span className="text-sm font-semibold text-red-500">
            {malicious}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">Suspicious</span>
          <span className="text-sm font-semibold text-yellow-500">
            {suspicious}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">Harmless</span>
          <span className="text-sm font-semibold text-green-500">
            {harmless}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">Undetected</span>
          <span className="text-sm font-semibold text-muted-foreground">
            {undetected}
          </span>
        </div>

        {/* Categories as pill badges */}
        {categories.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last analysis */}
        <p className="text-xs text-muted-foreground">
          Last analysis: {lastAnalysis}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded detail: Port Scan                                          */
/* ------------------------------------------------------------------ */

function PortScanDetail({ raw }: { raw: Record<string, unknown> }) {
  const openCount = (raw.open_count as number) ?? 0;
  const closedCount = (raw.closed_count as number) ?? 0;
  const filteredCount = (raw.filtered_count as number) ?? 0;
  const ports = (raw.ports as Array<{
    port: number;
    protocol: string;
    state: string;
    service: string;
  }>) ?? [];

  const barData = [
    { name: "Open", value: openCount, color: "#22c55e" },
    { name: "Closed", value: closedCount, color: "#ef4444" },
    { name: "Filtered", value: filteredCount, color: "#eab308" },
  ].filter((d) => d.value > 0);

  // Sort ports: open first, then filtered, then closed
  const sortedPorts = [...ports].sort((a, b) => {
    const order: Record<string, number> = {
      open: 0,
      filtered: 1,
      closed: 2,
    };
    return (order[a.state] ?? 3) - (order[b.state] ?? 3) || a.port - b.port;
  });

  return (
    <div className="space-y-4 pt-2">
      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-lg font-bold text-green-500">{openCount}</p>
        </div>
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Closed</p>
          <p className="text-lg font-bold text-red-500">{closedCount}</p>
        </div>
        <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Filtered</p>
          <p className="text-lg font-bold text-yellow-500">{filteredCount}</p>
        </div>
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <Card className="border-border bg-secondary/30">
          <CardContent className="p-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="20%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Port table */}
      {sortedPorts.length > 0 && (
        <Card className="border-border bg-secondary/30">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[240px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">
                      Port
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Protocol
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      State
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Service
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPorts.map((p) => (
                    <TableRow key={`${p.port}/${p.protocol}`}>
                      <TableCell className="font-mono text-foreground">
                        {p.port}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground uppercase text-xs">
                        {p.protocol}
                      </TableCell>
                      <TableCell>
                        <StateBadge state={p.state} />
                      </TableCell>
                      <TableCell className="font-mono text-foreground text-sm">
                        {p.service}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---- Port state badge ---- */
function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    open: "border-green-500/50 bg-green-500/10 text-green-500",
    closed: "border-red-500/50 bg-red-500/10 text-red-500",
    filtered: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
  };
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", styles[state] ?? "border-border")}
    >
      {state}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini card helper (for IP Lookup 2×2 grid)                          */
/* ------------------------------------------------------------------ */

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground truncate">
        {value}
      </p>
    </div>
  );
}