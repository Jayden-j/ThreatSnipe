"use client";

import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";
import {
  Loader2,
  Search,
  AlertCircle,
  Shield,
  Lock,
  Calendar,
  Globe,
  Server,
  FileKey,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SslResult {
  host: string;
  subject: { cn: string; org: string };
  issuer: { cn: string; org: string };
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  protocol: string;
  serialNumber: string;
  sanList: string[];
}

// ─── SslForm ──────────────────────────────────────────────────────────────────

function SslForm() {
  const [hostInput, setHostInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SslResult | null>(null);
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
        `/api/ssl?host=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "SSL check failed");
      }

      const data: SslResult = await response.json();
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
          <Lock className="h-6 w-6 text-primary" />
          SSL Certificate Checker
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check SSL/TLS certificate details and validity for any domain.
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
            "Check SSL"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Host header */}
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-semibold text-foreground">
              {result.host}
            </p>
            <CopyButton value={result.host} label="hostname" />
          </div>

          {/* Card 1: Validity Status */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Validity Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {result.isExpired ? (
                  <Badge variant="outline" className="border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">
                    ❌ Expired
                  </Badge>
                ) : result.isExpiringSoon ? (
                  <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">
                    ⚠️ Expiring Soon
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm text-green-500">
                    ✅ Valid
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className={cn(
                    "font-semibold",
                    result.daysUntilExpiry < 30
                      ? "text-red-500"
                      : result.daysUntilExpiry < 60
                        ? "text-yellow-500"
                        : "text-green-500"
                  )}>
                    {result.daysUntilExpiry < 0 ? 0 : result.daysUntilExpiry} days
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    ((result.daysUntilExpiry < 0 ? 0 : result.daysUntilExpiry) / 90) * 100,
                    100
                  )}
                  className={cn(
                    "h-2",
                    result.daysUntilExpiry < 30
                      ? "[&>div]:bg-red-500"
                      : result.daysUntilExpiry < 60
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-green-500"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Certificate Details */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileKey className="h-4 w-4 text-primary" />
                Certificate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Subject CN</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.subject.cn || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subject Org</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.subject.org || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issuer CN</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.issuer.cn || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issuer Org</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.issuer.org || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protocol</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.protocol}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Serial Number</p>
                  <p className="font-mono text-xs text-foreground break-all">
                    {result.serialNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: SAN List */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-primary" />
                Subject Alternative Names ({result.sanList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {result.sanList.map((san, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5 text-sm font-mono text-foreground"
                    >
                      <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {san}
                    </div>
                  ))}
                  {result.sanList.length === 0 && (
                    <p className="text-sm text-muted-foreground">No SAN entries</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Card 4: Validity Dates */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-secondary/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Issued On</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.validFrom}
                  </p>
                </div>
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Expires On</p>
                  <p className="font-mono text-sm text-foreground">
                    {result.validTo}
                  </p>
                </div>
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function SslPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Lock className="h-6 w-6 text-primary" />
              SSL Certificate Checker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SslForm />
    </Suspense>
  );
}