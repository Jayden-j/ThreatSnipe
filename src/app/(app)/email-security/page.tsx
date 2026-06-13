"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import {
  Loader2,
  Search,
  AlertCircle,
  Shield,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RelatedTools, RelatedToolsStrip } from "@/components/related-tools";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpfResult {
  raw: string | null;
  grade: string;
  verdict: string;
  mechanisms: string[];
}

interface DkimResult {
  found: boolean;
  selector: string | null;
  raw: string | null;
  grade: string;
  verdict: string;
}

interface DmarcResult {
  raw: string | null;
  grade: string;
  policy: string;
  rua: string | null;
  pct: number;
  verdict: string;
}

interface EmailSecurityResult {
  domain: string;
  spf: SpfResult;
  dkim: DkimResult;
  dmarc: DmarcResult;
  overallGrade: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: "border-green-500/30 bg-green-500/10 text-green-500",
  B: "border-green-500/30 bg-green-500/10 text-green-500",
  C: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  D: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  F: "border-red-500/30 bg-red-500/10 text-red-500",
};

const GRADE_BG: Record<string, string> = {
  A: "bg-green-500/10 text-green-500 border-green-500/30",
  B: "bg-green-500/10 text-green-500 border-green-500/30",
  C: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  D: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  F: "bg-red-500/10 text-red-500 border-red-500/30",
};

// ─── GradeBadge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = size === "lg" ? "text-3xl px-6 py-3" : size === "sm" ? "text-xs px-2 py-0.5" : "text-lg px-4 py-2";
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold rounded-md",
        sizeClasses,
        GRADE_BG[grade] || "border-border bg-muted text-muted-foreground"
      )}
    >
      {grade}
    </Badge>
  );
}

// ─── EmailSecurityForm ────────────────────────────────────────────────────────

function EmailSecurityForm() {
  const searchParams = useSearchParams();
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailSecurityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoTriggered.current) {
      autoTriggered.current = true;
      setDomainInput(q);
      setLoading(true);
      fetch(`/api/email-security?domain=${encodeURIComponent(q)}`)
        .then(async (r) => {
          if (!r.ok) {
            const e = await r.json().catch(() => null);
            throw new Error(e?.error || "Email security check failed");
          }
          const data: EmailSecurityResult = await r.json();
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
        `/api/email-security?domain=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Email security check failed");
      }

      const data: EmailSecurityResult = await response.json();
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
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Mail className="h-6 w-6 text-primary" />
          Email Security Validator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check SPF, DKIM, and DMARC DNS records for any domain.
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
              Validating...
            </>
          ) : (
            "Validate"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Domain & Overall Grade */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-semibold text-foreground">
                {result.domain}
              </p>
              <CopyButton value={result.domain} label="domain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overall:</span>
              <GradeBadge grade={result.overallGrade} size="lg" />
            </div>
          </div>

          {/* Three cards: SPF | DKIM | DMARC */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* SPF Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  SPF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <GradeBadge grade={result.spf.grade} size="sm" />
                </div>
                {result.spf.raw ? (
                  <div className="rounded-md bg-secondary/50 p-3">
                    <code className="text-xs text-foreground break-all leading-relaxed">
                      {result.spf.raw}
                    </code>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-500">No SPF record</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.spf.verdict}
                </p>
                {result.spf.mechanisms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.spf.mechanisms.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-border">
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DKIM Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  DKIM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <GradeBadge grade={result.dkim.grade} size="sm" />
                </div>
                {result.dkim.found ? (
                  <>
                    <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">
                        Found (selector: {result.dkim.selector})
                      </span>
                    </div>
                    {result.dkim.raw && (
                      <div className="rounded-md bg-secondary/50 p-3">
                        <code className="text-xs text-foreground break-all leading-relaxed">
                          {result.dkim.raw}
                        </code>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-500">No DKIM record</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.dkim.verdict}
                </p>
              </CardContent>
            </Card>

            {/* DMARC Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  DMARC
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <GradeBadge grade={result.dmarc.grade} size="sm" />
                </div>
                {result.dmarc.raw ? (
                  <div className="rounded-md bg-secondary/50 p-3">
                    <code className="text-xs text-foreground break-all leading-relaxed">
                      {result.dmarc.raw}
                    </code>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-500">No DMARC record</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.dmarc.verdict}
                </p>
                {result.dmarc.rua && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Reports:</span> {result.dmarc.rua}
                  </div>
                )}
                {result.dmarc.pct < 100 && (
                  <div className="text-xs text-yellow-500">
                    Applies to {result.dmarc.pct}% of email
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {result && !loading && (
        <RelatedToolsStrip currentHref="/email-security" currentInput={domainInput} />
      )}
      </div>

      <RelatedTools currentHref="/email-security" currentInput={domainInput} visible={!!(result && !loading)} />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function EmailSecurityPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Mail className="h-6 w-6 text-primary" />
              Email Security Validator
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <EmailSecurityForm />
    </Suspense>
  );
}