"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/copy-button";
import { downloadCSV } from "@/lib/csv";
import gsap from "gsap";
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
  Network,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RelatedTools, RelatedToolsStrip } from "@/components/related-tools";

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
  type: "ip" | "domain";
  totalProviders: number;
  listedCount: number;
  results: BlacklistResult[];
}

interface CidrStreamLine {
  ip: string;
  totalIps: number;
  currentIp: number;
  listedCount: number;
  providers: string[];
  returnCodes: Array<{ provider: string; code: string | null; label: string | null }>;
  error?: string;
  type?: "dnsbl-complete" | "dnsbl-error";
}

interface CidrResult {
  ip: string;
  listedCount: number;
  providers: string[];
  returnCodes: Array<{ provider: string; code: string | null; label: string | null }>;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DANGER_THRESHOLD = 5;
const WARN_THRESHOLD = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidIP(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((octet) => {
    const num = parseInt(octet, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && octet === String(num);
  });
}

function detectTargetType(input: string): "ip" | "domain" {
  return isValidIP(input.trim()) ? "ip" : "domain";
}

// ─── Tab 1: IP / Domain Check ────────────────────────────────────────────────

function IpDomainForm() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlacklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoTriggered.current) {
      autoTriggered.current = true;
      setInput(q);
      const type = detectTargetType(q);
      setLoading(true);
      fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target: q }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const e = await r.json().catch(() => null);
            throw new Error(e?.error || "Blacklist check failed");
          }
          const data: BlacklistResponse = await r.json();
          setResult(data);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "An unexpected error occurred"))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setShowAll(false);

    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please enter an IP address or domain");
      return;
    }

    const type = detectTargetType(trimmed);
    setLoading(true);

    try {
      const response = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target: trimmed }),
      });

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

  const listedProviders = result?.results.filter((r) => r.listed) ?? [];
  const cleanProviders = result?.results.filter((r) => !r.listed) ?? [];
  const visibleClean = showAll ? cleanProviders : [];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter IP or domain"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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

      {loading && (
        <div className="space-y-3">
          <Progress value={45} className="h-2 w-full" />
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
                  {result.type === "ip" ? "IP Address" : "Domain"}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg font-semibold text-foreground truncate">
                    {result.ip}
                  </p>
                  <CopyButton value={result.ip} label={result.type === "ip" ? "IP" : "domain"} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      result.type === "ip"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-blue-500/30 bg-blue-500/10 text-blue-500"
                    )}
                  >
                    {result.type === "ip" ? "IP" : "Domain"}
                  </Badge>
                  {result.type === "ip" && (
                    <p className="text-xs text-muted-foreground">
                      Reversed: {result.reversedIp}
                    </p>
                  )}
                </div>
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

      {result && !loading && (
        <RelatedToolsStrip currentHref="/blacklist" currentInput={input} />
      )}
      </div>

      <RelatedTools currentHref="/blacklist" currentInput={input} visible={!!(result && !loading)} />
    </div>
  );
}

// ─── Tab 2: CIDR Range Check ─────────────────────────────────────────────────

function CidrForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CidrResult[]>([]);
  const [totalIps, setTotalIps] = useState(0);
  const [currentIp, setCurrentIp] = useState(0);
  const [complete, setComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  // GSAP expand when results come in
  useEffect(() => {
    if (!contentRef.current || results.length === 0) return;
    if (!showResults) return;

    gsap.killTweensOf(contentRef.current);
    gsap.fromTo(
      contentRef.current,
      { maxHeight: 0, opacity: 0 },
      { maxHeight: 2000, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, [showResults, results.length]);

  // Auto-expand when first result arrives
  useEffect(() => {
    if (results.length > 0 && !showResults) {
      setShowResults(true);
    }
  }, [results.length, showResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults([]);
    setTotalIps(0);
    setCurrentIp(0);
    setComplete(false);
    setShowResults(false);

    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please enter a CIDR range");
      return;
    }

    // Client-side validation for > /24
    const cidrMatch = trimmed.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(\d{1,2})$/);
    if (cidrMatch) {
      const mask = parseInt(cidrMatch[1], 10);
      if (mask < 24) {
        setError("CIDR range too large — maximum /24 (256 IPs)");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cidr", target: trimmed }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "CIDR check failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed: CidrStreamLine = JSON.parse(line);

            // Check for sentinel
            if (parsed.type === "dnsbl-complete") {
              setComplete(true);
              setCurrentIp(parsed.totalIps);
              continue;
            }
            if (parsed.type === "dnsbl-error") {
              setError(parsed.error ?? "Stream error");
              setLoading(false);
              return;
            }

            // Regular result line
            setTotalIps(parsed.totalIps);
            setCurrentIp(parsed.currentIp);
            setResults((prev) => [
              ...prev,
              {
                ip: parsed.ip,
                listedCount: parsed.listedCount,
                providers: parsed.providers,
                returnCodes: parsed.returnCodes,
                error: parsed.error,
              },
            ]);
          } catch {
            // skip malformed lines
          }
        }
      }

      setComplete(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Sort results: most-listed first
  const sortedResults = [...results].sort((a, b) => b.listedCount - a.listedCount);

  const totalListed = results.filter((r) => r.listedCount > 0).length;
  const totalClean = results.filter((r) => r.listedCount === 0).length;
  const totalListings = results.reduce((sum, r) => sum + r.listedCount, 0);

  const handleExportCSV = useCallback(() => {
    const rows = sortedResults.map((r) => ({
      "IP Address": r.ip,
      "Listed On": String(r.listedCount),
      Providers: r.providers.join("; "),
      Status: r.listedCount > 0 ? "Listed" : "Clean",
    }));
    downloadCSV(rows, `cidr-scan-${input.replace("/", "-")}-${new Date().toISOString().split("T")[0]}.csv`);
  }, [sortedResults, input]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Network className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter CIDR (e.g. 192.168.1.0/24)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
              Scanning...
            </>
          ) : (
            "Scan Range"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress bar during scan */}
      {loading && totalIps > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Checking {currentIp} of {totalIps} IPs...
            </span>
            <span className="font-mono text-foreground">
              {Math.round((currentIp / totalIps) * 100)}%
            </span>
          </div>
          <Progress
            value={(currentIp / totalIps) * 100}
            className="h-2 w-full"
          />
        </div>
      )}

      {/* Initial loading indicator before first stream data */}
      {loading && totalIps === 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Expanding CIDR and preparing scan...
        </div>
      )}

      {/* Results section with GSAP expand */}
      <div ref={contentRef} style={{ overflow: "hidden", maxHeight: 0, opacity: 0 }}>
        <div className="space-y-4">
          {/* Summary Cards */}
          {complete && results.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total IPs Checked</p>
                  <p className="text-2xl font-bold text-foreground">{results.length}</p>
                </CardContent>
              </Card>
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">IPs Listed</p>
                  <p className="text-2xl font-bold text-red-500">{totalListed}</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">IPs Clean</p>
                  <p className="text-2xl font-bold text-green-500">{totalClean}</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Listings</p>
                  <p className="text-2xl font-bold text-yellow-500">{totalListings}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    Results ({results.length} IPs)
                  </p>
                  {complete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <FileDown className="mr-2 h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">IP Address</TableHead>
                        <TableHead className="text-muted-foreground text-center">Listed On</TableHead>
                        <TableHead className="text-muted-foreground">Providers</TableHead>
                        <TableHead className="text-muted-foreground text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((r) => (
                        <TableRow key={r.ip}>
                          <TableCell className="font-mono text-foreground text-sm">
                            {r.ip}
                          </TableCell>
                          <TableCell className="text-center font-mono text-foreground text-sm">
                            {r.listedCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[300px] truncate">
                            {r.providers.length > 0
                              ? r.providers.join(", ")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.listedCount > 0 ? (
                              <Badge
                                variant="outline"
                                className="border-red-500/30 bg-red-500/10 text-red-500 text-xs"
                              >
                                Listed
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-green-500/30 bg-green-500/10 text-green-500 text-xs"
                              >
                                Clean
                              </Badge>
                            )}
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
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function BlacklistPage() {
  const [activeTab, setActiveTab] = useState("ip-domain");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <List className="h-6 w-6 text-primary" />
          Blacklist Check
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan an IP or domain against 45+ DNSBL blacklist providers, or check an entire CIDR range.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ip-domain">IP / Domain</TabsTrigger>
          <TabsTrigger value="cidr">CIDR Range</TabsTrigger>
        </TabsList>

        <TabsContent value="ip-domain" className="mt-6">
          <Suspense fallback={
            <div className="flex flex-col gap-3">
              <div className="h-10 w-full animate-pulse rounded bg-secondary" />
            </div>
          }>
            <IpDomainForm />
          </Suspense>
        </TabsContent>

        <TabsContent value="cidr" className="mt-6">
          <CidrForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}