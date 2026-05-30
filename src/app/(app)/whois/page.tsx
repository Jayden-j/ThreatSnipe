"use client";

import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { RelativeTime } from "@/lib/time-ago";
import {
  Loader2,
  Search,
  AlertCircle,
  Globe,
  Calendar,
  Server,
  Building2,
  User,
  Mail,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhoisResult {
  domain: string;
  registrar: string;
  creationDate: string;
  expirationDate: string;
  updatedDate: string;
  nameServers: string[];
  registrantName: string;
  registrantOrganization: string;
  registrantCountry: string;
  registrantEmail: string;
  rawText: string;
}

// ─── InfoRow Component ────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  copyValue,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  copyValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border px-4 py-3",
      highlight
        ? "border-green-500/20 bg-green-500/5"
        : "border-border bg-secondary/30"
    )}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {value}
          </p>
          {copyValue && <CopyButton value={copyValue} />}
        </div>
      </div>
    </div>
  );
}

// ─── WhoisForm ────────────────────────────────────────────────────────────────

function WhoisForm() {
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setShowRaw(false);

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
        `/api/whois?hostname=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "WHOIS lookup failed");
      }

      const data: WhoisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const isExpired = result
    ? new Date(result.expirationDate) < new Date()
    : false;
  const isExpiringSoon = result
    ? !isExpired && new Date(result.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Globe className="h-6 w-6 text-primary" />
          WHOIS Lookup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Look up domain registration details including registrar, dates, name
          servers, and registrant information.
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
              Looking up...
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
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Domain Header */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xl font-semibold text-foreground">
                      {result.domain}
                    </p>
                    <CopyButton value={result.domain} label="domain" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Registrar: {result.registrar}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isExpired && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                  {isExpiringSoon && (
                    <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                      Expiring Soon
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
                    Registered
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoRow
              icon={Calendar}
              label="Created"
              value={result.creationDate}
              copyValue={result.creationDate}
            />
            <InfoRow
              icon={Calendar}
              label="Expires"
              value={result.expirationDate}
              copyValue={result.expirationDate}
              highlight={isExpiringSoon}
            />
            <InfoRow
              icon={Calendar}
              label="Last Updated"
              value={result.updatedDate}
              copyValue={result.updatedDate}
            />
          </div>

          {/* Registrant Info */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-primary" />
                Registrant Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.registrantName !== "—" && (
                  <InfoRow
                    icon={User}
                    label="Name"
                    value={result.registrantName}
                    copyValue={result.registrantName}
                  />
                )}
                {result.registrantOrganization !== "—" && (
                  <InfoRow
                    icon={Building2}
                    label="Organization"
                    value={result.registrantOrganization}
                    copyValue={result.registrantOrganization}
                  />
                )}
                {result.registrantCountry !== "—" && (
                  <InfoRow
                    icon={Globe}
                    label="Country"
                    value={result.registrantCountry}
                    copyValue={result.registrantCountry}
                  />
                )}
                {result.registrantEmail !== "—" && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={result.registrantEmail}
                    copyValue={result.registrantEmail}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Name Servers */}
          {result.nameServers.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Server className="h-4 w-4 text-primary" />
                  Name Servers ({result.nameServers.length})
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {result.nameServers.map((ns, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-2.5"
                    >
                      <span className="font-mono text-sm text-foreground">
                        {ns}
                      </span>
                      <CopyButton value={ns} label="NS" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Output */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Raw WHOIS Data
                </span>
                <Shield
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showRaw && "rotate-180"
                  )}
                />
              </button>
              {showRaw && (
                <pre className="mt-3 max-h-[400px] overflow-auto rounded-lg bg-background p-4 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {result.rawText}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function WhoisPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Globe className="h-6 w-6 text-primary" />
              WHOIS Lookup
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <WhoisForm />
    </Suspense>
  );
}