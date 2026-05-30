"use client";

import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";
import {
  Loader2,
  Search,
  AlertCircle,
  Globe,
  Network,
  Server,
  Mail,
  FileText,
  BookOpen,
  Fingerprint,
  ArrowUpDown,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DnsRecord {
  type: string;
  value: string;
}

interface DnsResult {
  domain: string;
  records: DnsRecord[];
  summary: {
    a: number;
    aaaa: number;
    mx: number;
    txt: number;
    cname: number;
    ns: number;
    soa: number;
    ptr: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_TYPE_COLORS: Record<string, string> = {
  A: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  AAAA: "border-indigo-500/30 bg-indigo-500/10 text-indigo-500",
  MX: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  TXT: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  CNAME: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500",
  NS: "border-green-500/30 bg-green-500/10 text-green-500",
  SOA: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  PTR: "border-pink-500/30 bg-pink-500/10 text-pink-500",
};

const RECORD_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  A: Globe,
  AAAA: Globe,
  MX: Mail,
  TXT: FileText,
  CNAME: BookOpen,
  NS: Server,
  SOA: Fingerprint,
  PTR: ArrowUpDown,
};

// ─── DnsForm ──────────────────────────────────────────────────────────────────

function DnsForm() {
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setFilterType(null);

    const trimmed = domainInput.trim();
    if (!trimmed) {
      setError("Please enter a domain");
      return;
    }

    if (!trimmed.includes(".")) {
      setError("Invalid domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/dns?hostname=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "DNS lookup failed");
      }

      const data: DnsResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRecordCount = (type: string) => {
    if (!result) return 0;
    const key = type.toLowerCase() as keyof typeof result.summary;
    return result.summary[key] ?? 0;
  };

  const filteredRecords = result
    ? filterType
        ? result.records.filter((r) => r.type === filterType)
        : result.records
    : [];

  // Get unique record types for filter chips
  const uniqueTypes = result
    ? [...new Set(result.records.map((r) => r.type))]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Network className="h-6 w-6 text-primary" />
          DNS Record Viewer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Look up DNS records for any domain — A, AAAA, MX, TXT, CNAME, NS,
          SOA, and PTR records.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="example.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
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
              Resolving...
            </>
          ) : (
            "Lookup"
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
          <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-20 animate-pulse rounded-full bg-secondary" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Summary Bar */}
          <div className="flex flex-wrap gap-2">
            {[
              { type: "A", label: "A", count: getRecordCount("a") },
              { type: "AAAA", label: "AAAA", count: getRecordCount("aaaa") },
              { type: "MX", label: "MX", count: getRecordCount("mx") },
              { type: "TXT", label: "TXT", count: getRecordCount("txt") },
              { type: "CNAME", label: "CNAME", count: getRecordCount("cname") },
              { type: "NS", label: "NS", count: getRecordCount("ns") },
              { type: "SOA", label: "SOA", count: getRecordCount("soa") ? 1 : 0 },
              { type: "PTR", label: "PTR", count: getRecordCount("ptr") },
            ].map(({ type, label, count }) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === type
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                    : count > 0
                      ? "border-border bg-secondary/50 text-foreground hover:bg-secondary"
                      : "border-border/50 bg-transparent text-muted-foreground/40 cursor-default"
                )}
              >
                <Hash className="h-3 w-3" />
                {label}
                <span className={cn(
                  "ml-0.5",
                  count > 0 ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {count}
                </span>
              </button>
            ))}
            {filterType && (
              <button
                onClick={() => setFilterType(null)}
                className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Domain header */}
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-semibold text-foreground">
              {result.domain}
            </p>
            <CopyButton value={result.domain} label="domain" />
            <span className="text-xs text-muted-foreground">
              {result.records.length} record{result.records.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Records List */}
          {filteredRecords.length > 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <div className="divide-y divide-border">
                    {filteredRecords.map((record, index) => {
                      const Icon = RECORD_TYPE_ICONS[record.type] || Globe;
                      const typeColor = RECORD_TYPE_COLORS[record.type] || "border-border bg-muted text-muted-foreground";

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0 font-semibold", typeColor)}
                              >
                                {record.type}
                              </Badge>
                              <CopyButton
                                value={record.value}
                                label={`${record.type} record`}
                                className="opacity-0 group-hover:opacity-100"
                              />
                            </div>
                            <p className="font-mono text-sm text-foreground break-all leading-relaxed">
                              {record.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {filterType
                  ? `No ${filterType} records found for this domain.`
                  : "No DNS records found for this domain."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function DnsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Network className="h-6 w-6 text-primary" />
              DNS Record Viewer
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <DnsForm />
    </Suspense>
  );
}