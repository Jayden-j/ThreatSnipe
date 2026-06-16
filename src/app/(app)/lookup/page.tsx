"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { IpResultCard } from "@/components/ip-result-card";
import { RelatedTools, RelatedToolsStrip } from "@/components/related-tools";

interface LookupResult {
  ip: string;
  abuseScore: number;
  country: string;
  isp: string;
  totalReports: number;
  lastReported: string | null;
  originalInput?: string;
  isDomain?: boolean;
  resolvedIp?: string;
}

function LookupForm() {
  const searchParams = useSearchParams();
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const ip = searchParams.get("ip") || searchParams.get("q");
    if (ip && !autoTriggered.current) {
      autoTriggered.current = true;
      setIpInput(ip);
      // Auto-trigger the scan
      setLoading(true);
      fetch(`/api/lookup?input=${encodeURIComponent(ip)}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || "Lookup failed");
          }
          const data: LookupResult = await response.json();
          setResult(data);
          void fetch("/api/alerts/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool_type: "ip_lookup", target: ip, result: data }) }).catch(() => {});
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

    const trimmedIp = ipInput.trim();
    if (!trimmedIp) {
      setError("Please enter an IP address or domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/lookup?input=${encodeURIComponent(trimmedIp)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Lookup failed");
      }

      const data: LookupResult = await response.json();
      setResult(data);
      void fetch("/api/alerts/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool_type: "ip_lookup", target: trimmedIp, result: data }) }).catch(() => {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abuse Checker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the reputation of an IP address or domain using AbuseIPDB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter IP address or domain"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
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
                Scanning
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
            <div className="h-24 animate-pulse rounded-lg bg-secondary" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 animate-pulse rounded-md bg-secondary" />
              <div className="h-16 animate-pulse rounded-md bg-secondary" />
              <div className="h-16 animate-pulse rounded-md bg-secondary" />
              <div className="h-16 animate-pulse rounded-md bg-secondary" />
            </div>
          </div>
        )}

        {result && !loading && <IpResultCard data={result} />}

        {result && !loading && (
          <RelatedToolsStrip currentHref="/lookup" currentInput={ipInput} />
        )}
      </div>

      <RelatedTools currentHref="/lookup" currentInput={ipInput} visible={!!(result && !loading)} />
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abuse Checker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the reputation of an IP address using AbuseIPDB.
          </p>
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded bg-secondary" />
          <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="h-24 animate-pulse rounded-lg bg-secondary" />
        </div>
      </div>
    }>
      <LookupForm />
    </Suspense>
  );
}