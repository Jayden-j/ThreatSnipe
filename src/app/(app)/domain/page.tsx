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
  Search,
  Clock,
  ExternalLink,
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
          className="border-green-500/50 bg-green-500/10 text-green-500 px-4 py-1.5 text-sm font-semibold"
        >
          CLEAN
        </Badge>
      );
    case "SUSPICIOUS":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500 px-4 py-1.5 text-sm font-semibold"
        >
          SUSPICIOUS
        </Badge>
      );
    case "MALICIOUS":
      return (
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/10 text-red-500 px-4 py-1.5 text-sm font-semibold"
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

  const totalVendors = result
    ? result.malicious + result.suspicious + result.harmless + result.undetected
    : 0;
  const flaggedCount = result ? result.malicious + result.suspicious : 0;
  const vtUrl = result
    ? `https://www.virustotal.com/gui/domain/${result.domain}`
    : "#";

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
            {/* Header with domain, verdict, and reputation score */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xl font-semibold text-foreground">
                  {result.domain}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {flaggedCount} of {totalVendors} security vendors flagged this domain
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-border text-xs",
                    getReputationColor(result.reputation)
                  )}
                >
                  Score: {result.reputation}
                </Badge>
                {getVerdictBadge(result.verdict)}
              </div>
            </div>

            {/* Stats in a 2x2 grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Malicious</span>
                </span>
                <span className="text-lg font-bold text-red-500">{result.malicious}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Suspicious</span>
                </span>
                <span className="text-lg font-bold text-yellow-500">{result.suspicious}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-green-500/20 bg-green-500/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Harmless</span>
                </span>
                <span className="text-lg font-bold text-green-500">{result.harmless}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted px-4 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">Undetected</span>
                </span>
                <span className="text-lg font-bold text-muted-foreground">{result.undetected}</span>
              </div>
            </div>

            {/* Categories */}
            {result.categories.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom row: date left, VT link right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Last analysis: {result.lastAnalysisDate}
              </div>
              <a
                href={vtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                VirusTotal
              </a>
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