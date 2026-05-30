"use client";

import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CopyButton } from "@/components/copy-button";
import {
  Loader2,
  Search,
  AlertCircle,
  Globe,
  Server,
  Wifi,
  Activity,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortResult {
  open: boolean;
  latencyMs: number | null;
}

interface HttpResult {
  statusCode: number | null;
  responseTimeMs: number | null;
  redirectUrl: string | null;
  error: string | null;
}

interface ServerStatusResult {
  host: string;
  resolvedIp: string | null;
  dnsStatus: "resolved" | "failed";
  ports: {
    80: PortResult;
    443: PortResult;
  };
  http: HttpResult;
  overallStatus: "up" | "degraded" | "down";
}

// ─── ServerStatusForm ─────────────────────────────────────────────────────────

function ServerStatusForm() {
  const [hostInput, setHostInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServerStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = hostInput.trim();
    if (!trimmed) {
      setError("Please enter a hostname");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/server-status?host=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Server status check failed");
      }

      const data: ServerStatusResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: "up" | "degraded" | "down") => {
    switch (status) {
      case "up":
        return (
          <Badge variant="outline" className="border-green-500/30 bg-green-500/10 px-4 py-2 text-lg text-green-500">
            🟢 Online
          </Badge>
        );
      case "degraded":
        return (
          <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-lg text-yellow-500">
            🟡 Degraded
          </Badge>
        );
      case "down":
        return (
          <Badge variant="outline" className="border-red-500/30 bg-red-500/10 px-4 py-2 text-lg text-red-500">
            🔴 Offline
          </Badge>
        );
    }
  };

  const getResponseTimeColor = (ms: number | null) => {
    if (ms === null) return "";
    if (ms < 500) return "[&>div]:bg-green-500";
    if (ms < 2000) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  const getResponseTimeLabel = (ms: number | null) => {
    if (ms === null) return "N/A";
    if (ms < 500) return "text-green-500";
    if (ms < 2000) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Activity className="h-6 w-6 text-primary" />
          Server Status Checker
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check if a server is online, measure response times, and inspect ports.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="example.com"
            value={hostInput}
            onChange={(e) => setHostInput(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Hero status badge */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-semibold text-foreground">
                {result.host}
              </p>
              <CopyButton value={result.host} label="hostname" />
            </div>
            {getStatusBadge(result.overallStatus)}
          </div>

          {/* Three check cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* DNS Card */}
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
                    <p className="text-xs text-muted-foreground mb-1">Resolved IP</p>
                    <p className="font-mono text-sm text-foreground">
                      {result.resolvedIp}
                    </p>
                  </div>
                )}
                {!result.resolvedIp && (
                  <p className="text-sm text-red-500">Could not resolve hostname</p>
                )}
              </CardContent>
            </Card>

            {/* Ports Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Wifi className="h-4 w-4 text-primary" />
                  Port Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Port 80 */}
                <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono text-foreground">Port 80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.ports[80].open ? (
                      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px] px-1.5">
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px] px-1.5">
                        Closed
                      </Badge>
                    )}
                    {result.ports[80].latencyMs !== null && (
                      <span className="text-xs text-muted-foreground">
                        {result.ports[80].latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
                {/* Port 443 */}
                <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono text-foreground">Port 443</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.ports[443].open ? (
                      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px] px-1.5">
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px] px-1.5">
                        Closed
                      </Badge>
                    )}
                    {result.ports[443].latencyMs !== null && (
                      <span className="text-xs text-muted-foreground">
                        {result.ports[443].latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HTTP Card */}
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
                      <Badge variant="outline" className={cn(
                        result.http.statusCode < 300
                          ? "border-green-500/30 bg-green-500/10 text-green-500"
                          : result.http.statusCode < 400
                            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
                            : "border-red-500/30 bg-red-500/10 text-red-500"
                      )}>
                        {result.http.statusCode}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span className={cn("font-semibold", getResponseTimeLabel(result.http.responseTimeMs))}>
                          {result.http.responseTimeMs}ms
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          ((result.http.responseTimeMs || 0) / 3000) * 100,
                          100
                        )}
                        className={cn(
                          "h-2",
                          getResponseTimeColor(result.http.responseTimeMs)
                        )}
                      />
                    </div>
                    {result.http.redirectUrl && (
                      <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-3 py-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {result.http.redirectUrl}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                      ❌ Error
                    </Badge>
                    {result.http.error && (
                      <span className="text-xs text-muted-foreground truncate">
                        {result.http.error}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ServerStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Activity className="h-6 w-6 text-primary" />
              Server Status Checker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ServerStatusForm />
    </Suspense>
  );
}