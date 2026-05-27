"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { IpResultCard } from "@/components/ip-result-card";

interface LookupResult {
  ip: string;
  abuseScore: number;
  country: string;
  isp: string;
  totalReports: number;
  lastReported: string | null;
}

export default function LookupPage() {
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmedIp = ipInput.trim();
    if (!trimmedIp) {
      setError("Please enter an IP address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/lookup?ip=${encodeURIComponent(trimmedIp)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Lookup failed");
      }

      const data: LookupResult = await response.json();
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
        <h1 className="text-2xl font-bold text-foreground">IP Lookup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check the reputation of an IP address using AbuseIPDB.
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
    </div>
  );
}
