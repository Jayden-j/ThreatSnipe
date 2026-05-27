"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Globe,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainResult {
  domain: string;
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  reputation: number;
  categories: string[];
  lastAnalysisDate: string;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
}

function getVerdictBadge(verdict: DomainResult["verdict"]) {
  switch (verdict) {
    case "CLEAN":
      return (
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-500/10 text-green-500"
        >
          CLEAN
        </Badge>
      );
    case "SUSPICIOUS":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
        >
          SUSPICIOUS
        </Badge>
      );
    case "MALICIOUS":
      return (
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/10 text-red-500"
        >
          MALICIOUS
        </Badge>
      );
  }
}

function getReputationColor(reputation: number): string {
  if (reputation > 0) return "text-green-500";
  if (reputation < 0) return "text-red-500";
  return "text-muted-foreground";
}

function getStatCountColor(
  count: number,
  type: "malicious" | "suspicious" | "harmless" | "undetected"
): string {
  if (type === "malicious") {
    return count > 0 ? "text-red-500" : "text-green-500";
  }
  if (type === "suspicious") {
    return count > 0 ? "text-yellow-500" : "text-green-500";
  }
  if (type === "harmless") return "text-green-500";
  return "text-muted-foreground";
}

function getStatBgColor(
  count: number,
  type: "malicious" | "suspicious" | "harmless" | "undetected"
): string {
  if (type === "malicious") {
    return count > 0
      ? "bg-red-500/10 border-red-500/20"
      : "bg-green-500/10 border-green-500/20";
  }
  if (type === "suspicious") {
    return count > 0
      ? "bg-yellow-500/10 border-yellow-500/20"
      : "bg-green-500/10 border-green-500/20";
  }
  if (type === "harmless") return "bg-green-500/10 border-green-500/20";
  return "bg-secondary border-border";
}

function DomainForm() {
  const searchParams = useSearchParams();
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const domain = searchParams.get("domain");
    if (domain && !autoTriggered.current) {
      autoTriggered.current = true;
      setDomainInput(domain);
      // Auto-trigger the scan
      setLoading(true);
      fetch(`/api/domain?domain=${encodeURIComponent(domain)}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || "Domain lookup failed");
          }
          const data: DomainResult = await response.json();
          setResult(data);
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmedDomain = domainInput.trim();
    if (!trimmedDomain) {
      setError("Please enter a domain or URL");
      return;
    }

    // Basic validation: must contain a dot
    if (!trimmedDomain.includes(".")) {
      setError("Invalid domain or URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/domain?domain=${encodeURIComponent(trimmedDomain)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Domain lookup failed");
      }

      const data: DomainResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Globe className="h-6 w-6 text-primary" />
          Domain Lookup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check the reputation of a domain or URL using VirusTotal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="example.com or https://example.com"
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
              Scanning
            </>
          ) : (
            "Scan Domain"
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
          <div className="h-24 animate-pulse rounded-lg bg-secondary" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
            <div className="h-16 animate-pulse rounded-md bg-secondary" />
          </div>
        </div>
      )}

      {result && !loading && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            {/* Header with domain and verdict */}
            <div className="mb-6 flex items-start justify-between">
              <p className="font-mono text-xl font-semibold text-foreground">
                {result.domain}
              </p>
              {getVerdictBadge(result.verdict)}
            </div>

            {/* Stat boxes 2x2 grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div
                className={cn(
                  "rounded-lg border p-4",
                  getStatBgColor(result.malicious, "malicious")
                )}
              >
                <p className="mb-1 text-sm text-muted-foreground">Malicious</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getStatCountColor(result.malicious, "malicious")
                  )}
                >
                  {result.malicious}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-4",
                  getStatBgColor(result.suspicious, "suspicious")
                )}
              >
                <p className="mb-1 text-sm text-muted-foreground">
                  Suspicious
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getStatCountColor(result.suspicious, "suspicious")
                  )}
                >
                  {result.suspicious}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-4",
                  getStatBgColor(result.harmless, "harmless")
                )}
              >
                <p className="mb-1 text-sm text-muted-foreground">Harmless</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getStatCountColor(result.harmless, "harmless")
                  )}
                >
                  {result.harmless}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-4",
                  getStatBgColor(result.undetected, "undetected")
                )}
              >
                <p className="mb-1 text-sm text-muted-foreground">
                  Undetected
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getStatCountColor(result.undetected, "undetected")
                  )}
                >
                  {result.undetected}
                </p>
              </div>
            </div>

            {/* Reputation Score */}
            <div className="mb-6 rounded-lg border border-border bg-secondary p-4">
              <p className="mb-1 text-sm text-muted-foreground">
                VirusTotal Reputation Score
              </p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  getReputationColor(result.reputation)
                )}
              >
                {result.reputation}
              </p>
            </div>

            {/* Categories */}
            {result.categories.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((category, index) => (
                    <span
                      key={index}
                      className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last Analysis Date */}
            <div className="text-sm text-muted-foreground">
              Last analysis: {result.lastAnalysisDate}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DomainPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Globe className="h-6 w-6 text-primary" />
              Domain Lookup
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the reputation of a domain or URL using VirusTotal.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-secondary" />
            <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
            <div className="h-24 animate-pulse rounded-lg bg-secondary" />
          </div>
        </div>
      }
    >
      <DomainForm />
    </Suspense>
  );
}