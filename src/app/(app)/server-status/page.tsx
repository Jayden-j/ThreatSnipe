"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Search,
  AlertCircle,
  Globe,
  Server,
  Wifi,
  Activity,
  Shield,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RelatedTools, RelatedToolsStrip } from "@/components/related-tools";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortResult {
  open: boolean;
  latencyMs: number | null;
}

interface RedirectStep {
  url: string;
  statusCode: number;
}

interface HttpResult {
  statusCode: number | null;
  responseTimeMs: number | null;
  redirectChain: RedirectStep[];
  headers: Record<string, string>;
  contentType: string | null;
  error: string | null;
}

interface LatencySample {
  label: string;
  ms: number;
}

interface LatencyStats {
  min: number;
  max: number;
  avg: number;
}

interface ServerStatusResult {
  host: string;
  resolvedIp: string | null;
  resolvedIpv6: string | null;
  dnsLatencyMs: number | null;
  dnsStatus: "resolved" | "failed";
  ports: {
    80: PortResult;
    443: PortResult;
    22: PortResult;
    21: PortResult;
  };
  http: HttpResult;
  ssl: {
    valid: boolean;
    daysUntilExpiry: number | null;
    issuer: string | null;
    isExpiringSoon: boolean;
    error: string | null;
  };
  latencySamples: LatencySample[];
  latencyStats: LatencyStats;
  overallStatus: "online" | "degraded" | "offline";
  degradedReasons: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const portNames: Record<number, string> = {
  80: "HTTP",
  443: "HTTPS",
  22: "SSH",
  21: "FTP",
};

function statusColorClass(status: "online" | "degraded" | "offline") {
  switch (status) {
    case "online":
      return "text-green-500 border-green-500/30 bg-green-500/10";
    case "degraded":
      return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
    case "offline":
      return "text-red-500 border-red-500/30 bg-red-500/10";
  }
}

function dotAnimClass(status: "online" | "degraded" | "offline") {
  if (status === "offline") return "";
  return "animate-pulse";
}

function statusLabel(status: "online" | "degraded" | "offline") {
  switch (status) {
    case "online":
      return "🟢 Online";
    case "degraded":
      return "🟡 Degraded";
    case "offline":
      return "🔴 Offline";
  }
}

function httpStatusColor(code: number | null): string {
  if (code === null) return "border-red-500/30 bg-red-500/10 text-red-500";
  if (code >= 200 && code < 300) return "border-green-500/30 bg-green-500/10 text-green-500";
  if (code >= 300 && code < 400) return "border-yellow-500/30 bg-yellow-500/10 text-yellow-500";
  return "border-red-500/30 bg-red-500/10 text-red-500";
}

function barColor(ms: number): string {
  if (ms === 0) return "#6b7280";
  if (ms < 300) return "#22c55e";
  if (ms < 1000) return "#eab308";
  return "#ef4444";
}

function getBarFill(entry: LatencySample): string {
  return barColor(entry.ms);
}

function progressColor(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 500) return "[&>div]:bg-green-500";
  if (ms < 2000) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

function sslProgressColor(days: number | null): string {
  if (days === null) return "";
  if (days >= 60) return "[&>div]:bg-green-500";
  if (days > 30) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

// ─── Custom Tooltip for BarChart ──────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{d.label}</p>
      <p className="text-muted-foreground">{d.ms}ms</p>
    </div>
  );
}

// ─── ServerStatusForm ─────────────────────────────────────────────────────────

function ServerStatusForm() {
  const searchParams = useSearchParams();
  const [hostInput, setHostInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServerStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmed = hostInput.trim();
    if (!trimmed && !result) {
      setError("Please enter a hostname");
      return;
    }

    const host = trimmed || result?.host || "";
    if (!host) {
      setError("Please enter a hostname");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/server-status?host=${encodeURIComponent(host)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Server status check failed");
      }

      const data: ServerStatusResult = await response.json();
      setResult(data);
      void fetch("/api/alerts/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool_type: "server_status", target: host, result: data }) }).catch(() => {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [hostInput, result]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoTriggered.current) {
      autoTriggered.current = true;
      setHostInput(q);
      setLoading(true);
      fetch(`/api/server-status?host=${encodeURIComponent(q)}`)
        .then(async (r) => {
          if (!r.ok) {
            const e = await r.json().catch(() => null);
            throw new Error(e?.error || "Server status check failed");
          }
          const data: ServerStatusResult = await r.json();
          setResult(data);
          void fetch("/api/alerts/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool_type: "server_status", target: q, result: data }) }).catch(() => {});
        })
        .catch((err) => setError(err instanceof Error ? err.message : "An unexpected error occurred"))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const statusBadgeClass = result ? statusColorClass(result.overallStatus) : "";

  // Security headers we track
  const securityHeaders = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-powered-by",
    "server",
  ];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
      {/* Header with Re-check button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Activity className="h-6 w-6 text-primary" />
            Server Status
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive server health check — DNS, ports, HTTP, SSL, and latency
          </p>
        </div>
        {result && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="gap-2 border-border"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Re-check
          </Button>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={(e) => { setResult(null); handleSubmit(e); }} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="example.com"
            value={hostInput}
            onChange={(e) => setHostInput(e.target.value)}
            className="border-border dark:border-white/15 bg-secondary pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Server"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-16 w-48 animate-pulse rounded bg-secondary" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-lg bg-secondary" />
          <div className="h-48 animate-pulse rounded-lg bg-secondary" />
        </div>
      )}

      {result && !loading && (
        <>
          {/* ─── Hero Section ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-semibold text-foreground">
                {result.host}
              </p>
              {result.resolvedIp && (
                <Badge
                  variant="outline"
                  className="border-border font-mono text-[10px] text-muted-foreground"
                >
                  {result.resolvedIp}
                </Badge>
              )}
            </div>
            {/* Status badge with animated dot */}
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-lg font-semibold",
                statusBadgeClass
              )}
            >
              <span className={cn("inline-block h-3 w-3 rounded-full bg-current", dotAnimClass(result.overallStatus))} />
              {statusLabel(result.overallStatus)}
            </div>
          </div>

          {/* Degraded reasons */}
          {result.degradedReasons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.degradedReasons.map((reason, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-500"
                >
                  {reason}
                </Badge>
              ))}
            </div>
          )}

          {/* Response time */}
          {result.latencyStats.avg > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {result.latencyStats.avg}ms avg
              </span>
              response time
            </div>
          )}

          {/* ─── Check Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* ── Card 1: DNS Resolution ────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-primary" />
                  DNS Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {result.dnsStatus === "resolved" ? (
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500">
                      ✅ Pass
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                      ❌ Fail
                    </Badge>
                  )}
                </div>
                {result.resolvedIp && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Resolved IPv4</p>
                    <p className="font-mono text-sm text-foreground">{result.resolvedIp}</p>
                  </div>
                )}
                {result.resolvedIpv6 && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Resolved IPv6</p>
                    <p className="font-mono text-sm text-muted-foreground">{result.resolvedIpv6}</p>
                  </div>
                )}
                {result.dnsLatencyMs !== null && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    {result.dnsLatencyMs}ms lookup time
                  </div>
                )}
                {!result.resolvedIp && !result.resolvedIpv6 && (
                  <p className="text-sm text-red-500">Could not resolve hostname</p>
                )}
              </CardContent>
            </Card>

            {/* ── Card 2: Port Status ──────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Wifi className="h-4 w-4 text-primary" />
                  Port Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Port</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Service</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right text-xs text-muted-foreground">Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[80, 443, 22, 21].map((port) => {
                      const p = result.ports[port as keyof typeof result.ports];
                      return (
                        <TableRow key={port} className="border-border hover:bg-transparent">
                          <TableCell className="font-mono text-sm text-foreground">{port}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{portNames[port]}</TableCell>
                          <TableCell>
                            {p.open ? (
                              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-[10px] text-green-500">
                                Open
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[10px] text-red-500">
                                Closed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {p.latencyMs !== null ? `${p.latencyMs}ms` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ── Card 3: HTTP Response ────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4 text-primary" />
                  HTTP Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.http.statusCode !== null ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Badge variant="outline" className={httpStatusColor(result.http.statusCode)}>
                        {result.http.statusCode}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span
                          className={cn(
                            "font-semibold",
                            result.http.responseTimeMs !== null && result.http.responseTimeMs < 500
                              ? "text-green-500"
                              : result.http.responseTimeMs !== null && result.http.responseTimeMs < 2000
                                ? "text-yellow-500"
                                : "text-red-500"
                          )}
                        >
                          {result.http.responseTimeMs}ms
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          ((result.http.responseTimeMs || 0) / 3000) * 100,
                          100
                        )}
                        className={cn("h-2", progressColor(result.http.responseTimeMs))}
                      />
                    </div>
                    {result.http.contentType && (
                      <div>
                        <p className="text-xs text-muted-foreground">Content Type</p>
                        <p className="font-mono text-xs text-foreground truncate">
                          {result.http.contentType}
                        </p>
                      </div>
                    )}
                    {/* Redirect chain */}
                    {result.http.redirectChain.length > 0 && (
                      <div className="space-y-1 rounded-md bg-secondary/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Redirect Chain</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {result.http.redirectChain.map((step, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5",
                                  step.statusCode >= 200 && step.statusCode < 300
                                    ? "border-green-500/30 bg-green-500/10 text-green-500"
                                    : step.statusCode >= 300 && step.statusCode < 400
                                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
                                      : "border-red-500/30 bg-red-500/10 text-red-500"
                                )}
                              >
                                {step.statusCode}
                              </Badge>
                              <span className="max-w-[120px] truncate font-mono text-[10px] text-muted-foreground">
                                {step.url.replace(/^https?:\/\//, "")}
                              </span>
                              {i < result.http.redirectChain.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                      ❌ Error
                    </Badge>
                    {result.http.error && (
                      <span className="truncate text-xs text-muted-foreground">{result.http.error}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Card 4: SSL Certificate ──────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  SSL Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.ssl.error ? (
                  <>
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                      ❌ No SSL / HTTP only
                    </Badge>
                    <p className="text-xs text-muted-foreground">{result.ssl.error}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {result.ssl.valid && !result.ssl.isExpiringSoon ? (
                        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500">
                          ✅ Valid
                        </Badge>
                      ) : result.ssl.isExpiringSoon ? (
                        <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
                          ⏳ Expiring Soon
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                          ❌ Expired
                        </Badge>
                      )}
                    </div>
                    {result.ssl.daysUntilExpiry !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Days Remaining</span>
                          <span
                            className={cn(
                              "font-semibold",
                          result.ssl.daysUntilExpiry >= 60
                                ? "text-green-500"
                                : result.ssl.daysUntilExpiry > 30
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            )}
                          >
                            {result.ssl.daysUntilExpiry} days
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            ((result.ssl.daysUntilExpiry || 0) / 365) * 100,
                            100
                          )}
                          className={cn("h-2", sslProgressColor(result.ssl.daysUntilExpiry))}
                        />
                      </div>
                    )}
                    {result.ssl.issuer && (
                      <div>
                        <p className="text-xs text-muted-foreground">Issuer</p>
                        <p className="text-sm text-foreground">{result.ssl.issuer}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Card 5 (full width): Response Headers ──────────────── */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Server className="h-4 w-4 text-primary" />
                Response Headers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground w-[240px]">Header</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityHeaders.map((header) => {
                    const value = result.http.headers[header];
                    const isMissing = !value;
                    const isSecurityHeader = [
                      "strict-transport-security",
                      "content-security-policy",
                      "x-frame-options",
                    ].includes(header);

                    return (
                      <TableRow key={header} className="border-border hover:bg-transparent">
                        <TableCell className="font-mono text-sm text-foreground">
                          {header}
                        </TableCell>
                        <TableCell>
                          {isMissing ? (
                            isSecurityHeader ? (
                              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[10px] text-red-500">
                                Missing
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                                Not set
                              </Badge>
                            )
                          ) : (
                            <span className="max-w-[300px] truncate font-mono text-xs text-foreground" title={value}>{value}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── Card 6 (full width): Latency Samples ───────────────── */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Latency Samples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.latencySamples}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(v) => `${v}ms`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="ms"
                      radius={[4, 4, 0, 0]}
                      fill="#22c55e"
                      // Color each bar individually
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            rx={4}
                            ry={4}
                            fill={barColor(payload.ms)}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Min / Avg / Max badges */}
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center rounded-md border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Min</span>
                  <span className="font-mono text-lg font-semibold text-green-500">
                    {result.latencyStats.min}ms
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-md border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Avg</span>
                  <span className="font-mono text-lg font-semibold text-yellow-500">
                    {result.latencyStats.avg}ms
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-md border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Max</span>
                  <span className="font-mono text-lg font-semibold text-red-500">
                    {result.latencyStats.max}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {result && !loading && (
        <RelatedToolsStrip currentHref="/server-status" currentInput={hostInput} />
      )}
      </div>

      <RelatedTools currentHref="/server-status" currentInput={hostInput} visible={!!(result && !loading)} />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ServerStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Activity className="h-6 w-6 text-primary" />
            Server Status
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ServerStatusForm />
    </Suspense>
  );
}