"use client";

import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";
import {
  Loader2,
  Search,
  AlertTriangle,
  ShieldOff,
  ShieldCheck,
  ExternalLink,
  Activity,
  List,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlacklistResult {
  provider: string;
  domain: string;
  description: string;
  listed: boolean;
  returnCode: string | null;
  returnLabel: string | null;
}

interface BlacklistResponse {
  ip: string;
  reversedIp: string;
  totalProviders: number;
  listedCount: number;
  results: BlacklistResult[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DANGER_THRESHOLD = 5;   // 5+ listings = danger
const WARN_THRESHOLD = 1;     // 1+ listings = warning

// ─── BlacklistForm ────────────────────────────────────────────────────────────

function BlacklistForm() {
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlacklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setShowAll(false);

    const trimmed = ipInput.trim();
    if (!trimmed) {
      setError("Please enter an IP address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/blacklist?hostname=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Blacklist check failed");
      }

      const data: BlacklistResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!result) return "";
    if (result.listedCount >= DANGER_THRESHOLD) return "text-red-500";
    if (result.listedCount >= WARN_THRESHOLD) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = () => {
    if (!result) return null;
    if (result.listedCount >= DANGER_THRESHOLD) return ShieldOff;
    if (result.listedCount >= WARN_THRESHOLD) return AlertTriangle;
    return ShieldCheck;
  };

  const getStatusLabel = () => {
    if (!result) return "";
    if (result.listedCount >= DANGER_THRESHOLD) return "Blacklisted";
    if (result.listedCount >= WARN_THRESHOLD) return "Suspicious";
    return "Clean";
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  // Separate listed vs not listed
  const listedProviders = result?.results.filter((r) => r.listed) ?? [];
  const cleanProviders = result?.results.filter((r) => !r.listed) ?? [];

  // Visible providers based on showAll toggle
  const visibleListed = listedProviders;
  const visibleClean = showAll ? cleanProviders : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <List className="h-6 w-6 text-primary" />
          Blacklist Check
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan an IP address against 45+ DNSBL blacklist providers including
          Spamhaus, Barracuda, SpamCop, SURBL, and more.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter an IP address (e.g. 8.8.8.8)"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
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
              Scanning 45+ providers...
            </>
          ) : (
            "Check Blacklists"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cn(
              "border-border bg-card transition-all duration-300",
              result.listedCount >= DANGER_THRESHOLD && "border-red-500/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]",
              result.listedCount >= WARN_THRESHOLD && result.listedCount < DANGER_THRESHOLD && "border-yellow-500/30 shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]",
              result.listedCount === 0 && "border-green-500/30 shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]"
            )}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                {StatusIcon && <StatusIcon className={cn("h-10 w-10 mb-3", statusColor)} />}
                <p className={cn("text-3xl font-bold", statusColor)}>
                  {getStatusLabel()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.listedCount} of {result.totalProviders} providers
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Activity className="h-4 w-4" />
                  IP Address
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg font-semibold text-foreground truncate">
                    {result.ip}
                  </p>
                  <CopyButton value={result.ip} label="IP" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reversed: {result.reversedIp}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Globe className="h-4 w-4" />
                  Blocklist Rate
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {((result.listedCount / result.totalProviders) * 100).toFixed(1)}%
                </p>
                <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(result.listedCount / result.totalProviders) * 100}%`,
                      backgroundColor:
                        result.listedCount >= DANGER_THRESHOLD
                          ? "#ef4444"
                          : result.listedCount >= WARN_THRESHOLD
                            ? "#eab308"
                            : "#22c55e",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listed Providers Section */}
          {listedProviders.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500 mb-4">
                  <ShieldOff className="h-4 w-4" />
                  Blacklisted on {listedProviders.length} provider{listedProviders.length !== 1 ? "s" : ""}
                </h3>
                <div className="space-y-2">
                  {listedProviders.map((provider, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                    >
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {provider.provider}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px] px-1.5 py-0"
                          >
                            Listed
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {provider.description}
                        </p>
                        {provider.returnLabel && (
                          <p className="text-xs text-red-400/80 mt-0.5 font-mono">
                            {provider.returnLabel}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {provider.domain}
                          </span>
                          <CopyButton value={provider.domain} label="domain" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clean Providers (collapsible) */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>
                  {showAll
                    ? "Hide clean providers"
                    : `Show all ${cleanProviders.length} clean providers`}
                </span>
                <ExternalLink
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showAll && "rotate-180"
                  )}
                />
              </button>

              {showAll && (
                <ScrollArea className="mt-3 max-h-[400px]">
                  <div className="space-y-1">
                    {visibleClean.map((provider, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span className="font-medium text-foreground min-w-[140px]">
                          {provider.provider}
                        </span>
                        <span className="text-xs text-muted-foreground/60 truncate">
                          {provider.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function BlacklistPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <List className="h-6 w-6 text-primary" />
              Blacklist Check
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <BlacklistForm />
    </Suspense>
  );
}