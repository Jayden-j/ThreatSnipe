"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { IpResultCard } from "@/components/ip-result-card";
import { CopyButton } from "@/components/copy-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Activity,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Globe,
  Lock,
  FileText,
  Mail,
  Server,
  List,
  ScanLine,
  Network,
  AlertCircle,
  ExternalLink,
  Calendar,
  FileKey,
  Wifi,
  ArrowRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  target: string;
  type: "ip" | "domain" | "cidr";
  checks_enabled: Record<string, boolean>;
  monitoring_enabled: boolean;
  check_interval: number;
  alerts_enabled: boolean;
  alert_severities: string[];
  alert_channels: string[];
  last_checked_at: string | null;
  last_status: "clean" | "suspicious" | "threat" | "unknown";
  checks_passed: number;
  checks_total: number;
  created_at: string;
}

interface AssetResult {
  id: string;
  asset_id: string;
  tool_type: string;
  result: any;
  status: string;
  checked_at: string;
}

interface AssetDetailResponse {
  asset: Asset;
  results: Record<string, AssetResult>;
}

// ─── Chart ─────────────────────────────────────────────────────────────────────

const BlacklistChart = dynamic(
  () => import("@/components/charts/blacklist-history-chart"),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-secondary" /> }
);

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOOL_TABS = [
  { key: "ip_lookup", label: "Abuse Checker" },
  { key: "domain_lookup", label: "VirusTotal Check" },
  { key: "port_scan", label: "Port Scan" },
  { key: "blacklist", label: "Blacklist" },
  { key: "dns_records", label: "DNS Records" },
  { key: "whois", label: "WHOIS" },
  { key: "ssl", label: "SSL" },
  { key: "email_security", label: "Email Security" },
  { key: "server_status", label: "Server Status" },
];

const INCOMPATIBLE_CHECKS: Record<string, string[]> = {
  domain: [],
  ip: ["dns_records", "ssl", "email_security", "server_status"],
  cidr: [
    "domain_lookup",
    "port_scan",
    "dns_records",
    "whois",
    "ssl",
    "email_security",
    "server_status",
  ],
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  clean: "border-green-500/30 bg-green-500/10 text-green-500",
  suspicious: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  threat: "border-red-500/30 bg-red-500/10 text-red-500",
  unknown: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  error: "border-red-500/30 bg-red-500/10 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  clean: "✅ Clean",
  suspicious: "⚠️ Suspicious",
  threat: "🔴 Threat",
  unknown: "Unknown",
  error: "❌ Error",
};

const CHILD_STATUS_BADGE: Record<string, string> = {
  clean: "border-green-500/30 bg-green-500/10 text-green-500",
  suspicious: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  threat: "border-red-500/30 bg-red-500/10 text-red-500",
  unknown: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function httpStatusColor(code: number | null): string {
  if (code === null) return "border-red-500/30 bg-red-500/10 text-red-500";
  if (code >= 200 && code < 300) return "border-green-500/30 bg-green-500/10 text-green-500";
  if (code >= 300 && code < 400) return "border-yellow-500/30 bg-yellow-500/10 text-yellow-500";
  return "border-red-500/30 bg-red-500/10 text-red-500";
}

// ─── CIDR Expansion ────────────────────────────────────────────────────────────

function expandCIDR(cidr: string): string[] {
  const [base, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (!base || isNaN(bits) || bits < 0 || bits > 32) return [];

  const parts = base.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return [];

  const ipNum =
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const networkStart = (ipNum & mask) >>> 0;
  const hostCount = bits === 32 ? 1 : Math.pow(2, 32 - bits);

  const ips: string[] = [];
  for (let i = 0; i < hostCount; i++) {
    const addr = (networkStart + i) >>> 0;
    ips.push(
      [
        (addr >>> 24) & 255,
        (addr >>> 16) & 255,
        (addr >>> 8) & 255,
        addr & 255,
      ].join(".")
    );
  }
  return ips;
}

// ─── Tab Result Renderers ──────────────────────────────────────────────────────

function IpLookupResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">Check failed</p>;
  return <IpResultCard data={result} />;
}

function DomainLookupResult({ result }: { result: any }) {
  if (!result || result.error) {
    return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  }
  const verdictColors: Record<string, string> = {
    CLEAN: "border-green-500/30 bg-green-500/10 text-green-500",
    SUSPICIOUS: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
    MALICIOUS: "border-red-500/30 bg-red-500/10 text-red-500",
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-lg font-semibold text-foreground">{result.domain}</p>
          <Badge variant="outline" className={cn("px-3 py-1", verdictColors[result.verdict])}>
            {result.verdict}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Malicious</p>
            <p className="text-lg font-bold text-red-500">{result.malicious}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Suspicious</p>
            <p className="text-lg font-bold text-yellow-500">{result.suspicious}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Harmless</p>
            <p className="text-lg font-bold text-green-500">{result.harmless}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Reputation</p>
            <p className="text-lg font-bold text-foreground">{result.reputation}</p>
          </div>
        </div>
        {result.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.categories.map((cat: string, i: number) => (
              <Badge key={i} variant="outline" className="border-border text-xs">{cat}</Badge>
            ))}
          </div>
        )}
        {result.lastAnalysisDate && (
          <p className="text-xs text-muted-foreground">Last analyzed: {result.lastAnalysisDate}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PortScanResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">Port</TableHead>
              <TableHead className="text-xs text-muted-foreground">Service</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.ports && Object.entries(result.ports).map(([port, info]: [string, any]) => (
              <TableRow key={port} className="border-border hover:bg-transparent">
                <TableCell className="font-mono text-sm text-foreground">{port}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{info.service || "—"}</TableCell>
                <TableCell>
                  {info.open ? (
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px]">Open</Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px]">Closed</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!result.ports || Object.keys(result.ports).length === 0) && (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={3} className="text-sm text-muted-foreground text-center py-4">No port data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BlacklistResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  const dangerThreshold = 5;
  const warnThreshold = 1;
  const listedCount = result.listedCount || 0;
  const total = result.totalProviders || 0;
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          {listedCount >= dangerThreshold ? (
            <ShieldOff className="h-8 w-8 text-red-500" />
          ) : listedCount >= warnThreshold ? (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-green-500" />
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">
              {listedCount >= dangerThreshold ? "Blacklisted" : listedCount >= warnThreshold ? "Suspicious" : "Clean"}
            </p>
            <p className="text-sm text-muted-foreground">{listedCount} of {total} providers</p>
          </div>
        </div>
        {total > 0 && (
          <Progress
            value={(listedCount / total) * 100}
            className={cn(
              "h-2",
              listedCount >= dangerThreshold ? "[&>div]:bg-red-500" : listedCount >= warnThreshold ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"
            )}
          />
        )}
        {result.results?.filter((r: any) => r.listed).map((r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-medium text-foreground">{r.provider}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DnsResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  const records = result.records || [];
  const summary = result.summary || {};
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        {Object.keys(summary).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary).map(([type, count]: [string, any]) => (
              <Badge key={type} variant="outline" className="border-border">
                {type.toUpperCase()}: {count}
              </Badge>
            ))}
          </div>
        )}
        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="text-xs text-muted-foreground">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((rec: any, i: number) => (
                <TableRow key={i} className="border-border hover:bg-transparent">
                  <TableCell className="font-mono text-sm text-foreground">{rec.type}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground break-all">{rec.value}</TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-4">No DNS records</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function WhoisResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <ScrollArea className="max-h-[500px]">
          <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{JSON.stringify(result, null, 2)}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SslResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-lg font-semibold text-foreground">{result.host}</p>
        <CopyButton value={result.host} label="hostname" />
      </div>
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
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">❌ Expired</Badge>
            ) : result.isExpiringSoon ? (
              <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">⚠️ Expiring Soon</Badge>
            ) : (
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm text-green-500">✅ Valid</Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days Remaining</span>
            <span className={cn("font-semibold", result.daysUntilExpiry < 30 ? "text-red-500" : result.daysUntilExpiry < 60 ? "text-yellow-500" : "text-green-500")}>
              {result.daysUntilExpiry < 0 ? 0 : result.daysUntilExpiry} days
            </span>
          </div>
          <Progress value={Math.min(((result.daysUntilExpiry < 0 ? 0 : result.daysUntilExpiry) / 90) * 100, 100)} className={cn("h-2", result.daysUntilExpiry < 30 ? "[&>div]:bg-red-500" : result.daysUntilExpiry < 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileKey className="h-4 w-4 text-primary" />
            Certificate Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted-foreground">Subject CN</p><p className="font-mono text-sm text-foreground">{result.subject?.cn || "N/A"}</p></div>
          <div><p className="text-xs text-muted-foreground">Issuer CN</p><p className="font-mono text-sm text-foreground">{result.issuer?.cn || "N/A"}</p></div>
          <div><p className="text-xs text-muted-foreground">Protocol</p><p className="font-mono text-sm text-foreground">{result.protocol}</p></div>
          <div><p className="text-xs text-muted-foreground">Serial Number</p><p className="font-mono text-xs text-foreground break-all">{result.serialNumber}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailSecurityResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        {result.spf && (
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">SPF Record</span>
              {result.spf.valid ? (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px]">Valid</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px]">Invalid</Badge>
              )}
            </div>
            {result.spf.raw && <p className="font-mono text-xs text-muted-foreground break-all">{result.spf.raw}</p>}
          </div>
        )}
        {result.dkim && (
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileKey className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">DKIM</span>
              {result.dkim.valid ? (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px]">Valid</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px]">Invalid</Badge>
              )}
            </div>
          </div>
        )}
        {result.dmarc && (
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">DMARC</span>
              {result.dmarc.valid ? (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px]">Valid</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[10px]">Invalid</Badge>
              )}
            </div>
            {result.dmarc.policy && <p className="text-xs text-muted-foreground">Policy: {result.dmarc.policy}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServerStatusResult({ result }: { result: any }) {
  if (!result || result.error) return <p className="text-sm text-muted-foreground">{result?.error || "No results"}</p>;
  const statusColors: Record<string, string> = {
    online: "border-green-500/30 bg-green-500/10 text-green-500",
    degraded: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
    offline: "border-red-500/30 bg-red-500/10 text-red-500",
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("px-3 py-1.5", statusColors[result.overallStatus] || statusColors.offline)}>
            {result.overallStatus === "online" ? "🟢 Online" : result.overallStatus === "degraded" ? "🟡 Degraded" : "🔴 Offline"}
          </Badge>
          {result.latencyStats?.avg > 0 && (
            <span className="text-sm text-muted-foreground">{result.latencyStats.avg}ms avg</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">DNS</p>
            <p className="font-mono text-sm text-foreground">{result.resolvedIp || "Failed"}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">HTTP Status</p>
            <p className="font-mono text-sm text-foreground">{result.http?.statusCode || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab Content ───────────────────────────────────────────────────────────────

function TabContent({
  toolType,
  result,
  enabled,
}: {
  toolType: string;
  result: AssetResult | undefined;
  enabled: boolean;
}) {
  if (!enabled) {
    return <p className="text-sm text-muted-foreground py-8 text-center">This check is disabled — enable it in settings</p>;
  }
  if (!result) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No results yet — click Re-run All Checks</p>;
  }

  const renderers: Record<string, (props: { result: any }) => React.ReactNode> = {
    ip_lookup: IpLookupResult,
    domain_lookup: DomainLookupResult,
    port_scan: PortScanResult,
    blacklist: BlacklistResult,
    dns_records: DnsResult,
    whois: WhoisResult,
    ssl: SslResult,
    email_security: EmailSecurityResult,
    server_status: ServerStatusResult,
  };

  const Renderer = renderers[toolType];
  if (!Renderer) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <ScrollArea className="max-h-[500px]">
            <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{JSON.stringify(result.result, null, 2)}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return <Renderer result={result.result} />;
}

// ─── 3-Step Add/Edit Asset Dialog ─────────────────────────────────────────────

function AddAssetDialog({
  open,
  onOpenChange,
  onCreated,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  initialData?: Partial<Asset>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialData?.name || "");
  const [target, setTarget] = useState(initialData?.target || "");
  const [type, setType] = useState<"ip" | "domain" | "cidr">(
    (initialData as any)?.type === "hostname"
      ? "ip"
      : (initialData?.type as "ip" | "domain" | "cidr") || "domain"
  );
  const [checks, setChecks] = useState<Record<string, boolean>>(
    initialData?.checks_enabled || {
      ip_lookup: false,
      domain_lookup: false,
      port_scan: false,
      blacklist: false,
      dns_records: false,
      whois: false,
      ssl: false,
      email_security: false,
      server_status: false,
    }
  );
  const [checkInterval, setCheckInterval] = useState<number>(
    initialData?.check_interval || 60
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !initialData) {
      setStep(1);
      setName("");
      setTarget("");
      setType("domain");
      setChecks({
        ip_lookup: false,
        domain_lookup: false,
        port_scan: false,
        blacklist: false,
        dns_records: false,
        whois: false,
        ssl: false,
        email_security: false,
        server_status: false,
      });
      setCheckInterval(60);
      setSaving(false);
    }
  }, [open, initialData]);

  useEffect(() => {
    if (open && initialData) {
      setStep(1);
      setSaving(false);
    }
  }, [open, initialData]);

  const localIncompatibleChecks: Record<string, string[]> = {
    domain: [],
    ip: ["dns_records", "ssl", "email_security", "server_status"],
    cidr: [
      "domain_lookup",
      "port_scan",
      "dns_records",
      "whois",
      "ssl",
      "email_security",
      "server_status",
    ],
  };

  const disabledChecks = localIncompatibleChecks[type] || [];

  useEffect(() => {
    setChecks((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of disabledChecks) {
        if (next[key] === true) {
          next[key] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [type]);

  const CHECK_OPTIONS: { key: string; label: string }[] = [
    { key: "ip_lookup", label: "Abuse Checker" },
    { key: "domain_lookup", label: "VirusTotal Check" },
    { key: "port_scan", label: "Port Scanner" },
    { key: "blacklist", label: "Blacklist Check" },
    { key: "dns_records", label: "DNS Records" },
    { key: "whois", label: "WHOIS Lookup" },
    { key: "ssl", label: "SSL Checker" },
    { key: "email_security", label: "Email Security" },
    { key: "server_status", label: "Server Status" },
  ];

  const CHECK_INTERVALS = [
    { value: 5, label: "Every 5 minutes" },
    { value: 10, label: "Every 10 minutes" },
    { value: 15, label: "Every 15 minutes" },
    { value: 30, label: "Every 30 minutes" },
    { value: 60, label: "Every 1 hour" },
    { value: 180, label: "Every 3 hours" },
    { value: 360, label: "Every 6 hours" },
    { value: 720, label: "Every 12 hours" },
    { value: 1440, label: "Every 24 hours" },
  ];

  const targetPlaceholder = type === "ip" ? "e.g. 192.168.1.1" : type === "domain" ? "e.g. example.com" : "e.g. 192.168.1.0/24";
  const isStep1Valid = name.trim().length > 0 && target.trim().length > 0;

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const payload = {
      name: name.trim(),
      target: target.trim(),
      type,
      checks_enabled: checks,
      monitoring_enabled: true,
      check_interval: checkInterval,
      alerts_enabled: true,
      alert_severities: ["critical", "high", "medium", "low"],
      alert_channels: [],
    };
    try {
      if (initialData?.id) {
        const response = await fetch(`/api/assets/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update asset");
      } else {
        const response = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create asset");
      }
      onCreated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{initialData ? "Edit Asset" : "Add Asset"}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : step > s
                      ? "bg-primary/30 text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {s}
                </div>
                <span className={cn("text-xs", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                  Step {s} of 3
                </span>
                {s < 3 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="asset-name" className="text-sm text-foreground">Name</Label>
                <Input
                  id="asset-name"
                  placeholder="e.g. My Web Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v as "ip" | "domain" | "cidr")}>
                  <SelectTrigger className="border-border bg-secondary text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="ip">IP</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="cidr">CIDR Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-target" className="text-sm text-foreground">Target</Label>
                <Input
                  id="asset-target"
                  placeholder={targetPlaceholder}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
            </>
          )}
          {step === 2 && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Checks to Run</Label>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                {CHECK_OPTIONS.map((option) => {
                  const isDisabled = disabledChecks.includes(option.key);
                  return (
                    <label key={option.key} className={cn("flex items-center gap-2", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}>
                      <Checkbox
                        checked={checks[option.key] ?? false}
                        onCheckedChange={(checked) => setChecks((prev) => ({ ...prev, [option.key]: checked === true }))}
                        disabled={isDisabled}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-40"
                      />
                      <span className={cn("text-sm", isDisabled ? "text-muted-foreground/40" : "text-foreground")}>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">How often to check this asset</Label>
              <Select value={String(checkInterval)} onValueChange={(v) => v && setCheckInterval(Number(v))}>
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {CHECK_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={String(interval.value)}>{interval.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>{step > 1 && <Button variant="outline" className="border-border" onClick={() => setStep(step - 1)}>Back</Button>}</div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={handleNext} disabled={step === 1 && !isStep1Valid} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving} className="w-full bg-green-600 text-white hover:bg-green-700">
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : initialData ? (
                  "Save"
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Asset Detail Page ─────────────────────────────────────────────────────────

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [results, setResults] = useState<Record<string, AssetResult>>({});
  const [loading, setLoading] = useState(true);
  const [runningChecks, setRunningChecks] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("ip_lookup");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [blacklistHistory, setBlacklistHistory] = useState<any[]>([]);
  // CIDR state
  const [selectedChildIp, setSelectedChildIp] = useState<string | null>(null);
  const [cidrIps, setCidrIps] = useState<string[]>([]);
  const [childRunningChecks, setChildRunningChecks] = useState(false);

  const fetchAsset = useCallback(async () => {
    try {
      const response = await fetch(`/api/assets/${id}`);
      if (!response.ok) throw new Error("Failed to fetch asset");
      const data: AssetDetailResponse = await response.json();
      const loadedAsset = {
        ...data.asset,
        type: ((["hostname"] as string[]).includes((data.asset as any).type) ? "ip" : data.asset.type) as "ip" | "domain" | "cidr",
      };
      setAsset(loadedAsset);
      setResults(data.results || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  // Expand CIDR range when asset is loaded
  useEffect(() => {
    if (asset?.type === "cidr") {
      setCidrIps(expandCIDR(asset.target));
    }
  }, [asset]);

  // Fetch blacklist history for chart
  useEffect(() => {
    if (!asset) return;
    const fetchHistory = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data } = await supabase
          .from("asset_results")
          .select("result, checked_at")
          .eq("asset_id", id)
          .eq("tool_type", "blacklist")
          .order("checked_at", { ascending: true });
        if (data) {
          setBlacklistHistory(data.map((r) => ({
            date: new Date(r.checked_at).toLocaleDateString(),
            listed: r.result?.listedCount || 0,
          })));
        }
      } catch {}
    };
    if (asset.type === "ip") {
      fetchHistory();
    }
  }, [asset, id]);

  // ─── CIDR child IP helpers ─────────────────────────────────────────────────

  function getChildIpResults(ip: string): { tool_type: string; result: AssetResult }[] {
    return Object.entries(results)
      .filter(([, r]) => r.result?.target === ip)
      .map(([toolType, r]) => ({ tool_type: toolType, result: r }));
  }

  function getChildIpStatus(ip: string): { status: string; checked_at: string | null; flagged: number; total: number } {
    const ipResults = getChildIpResults(ip);
    if (ipResults.length === 0) {
      return { status: "unknown", checked_at: null, flagged: 0, total: 0 };
    }
    let overallStatus = "clean";
    let flagged = 0;
    for (const r of ipResults) {
      if (r.result.status === "threat") {
        overallStatus = "threat";
        flagged++;
      } else if (r.result.status === "suspicious" && overallStatus !== "threat") {
        overallStatus = "suspicious";
        flagged++;
      } else if (r.result.status === "error") {
        overallStatus = "unknown";
        flagged++;
      }
    }
    const latestCheck = ipResults
      .map((r) => r.result.checked_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;
    return { status: overallStatus, checked_at: latestCheck, flagged, total: ipResults.length };
  }

  // ─── Child IP Sheet tab results ────────────────────────────────────────────

  function getChildIpTabResults(ip: string): Record<string, AssetResult> {
    const ipResults: Record<string, AssetResult> = {};
    for (const [toolType, r] of Object.entries(results)) {
      if (r.result?.target === ip) {
        ipResults[toolType] = r;
      }
    }
    return ipResults;
  }

  // ─── Run checks on a child IP ──────────────────────────────────────────────

  const handleRunChildIpChecks = async (ip: string) => {
    if (!asset) return;
    setChildRunningChecks(true);

    const enabledTools = Object.entries(asset.checks_enabled)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    for (let i = 0; i < enabledTools.length; i++) {
      const tool = enabledTools[i];
      try {
        const response = await fetch(`/api/assets/${id}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, target: ip }),
        });
        if (response.ok) {
          const data = await response.json();
          // Refresh results
          const refresh = await fetch(`/api/assets/${id}`);
          if (refresh.ok) {
            const refreshData = await refresh.json();
            setResults(refreshData.results || {});
          }
        }
      } catch (err) {
        console.error(`Check failed for ${ip}/${tool}:`, err);
      }
    }
    setChildRunningChecks(false);
  };

  // ─── Run all checks on CIDR asset ──────────────────────────────────────────

  const handleRunCidrAllChecks = async () => {
    if (!asset) return;
    setRunningChecks(true);

    const enabledTools = Object.entries(asset.checks_enabled)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    setCheckProgress({ current: 0, total: cidrIps.length });

    for (let i = 0; i < cidrIps.length; i++) {
      const ip = cidrIps[i];
      setCheckProgress({ current: i + 1, total: cidrIps.length });

      for (const tool of enabledTools) {
        try {
          const response = await fetch(`/api/assets/${id}/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool, target: ip }),
          });
          if (response.ok) {
            const data = await response.json();
            setResults((prev) => ({
              ...prev,
              [`${tool}-${ip}`]: {
                id: data.saved ? "saved" : "",
                asset_id: id,
                tool_type: tool,
                result: data.result,
                status: data.status,
                checked_at: new Date().toISOString(),
              },
            }));
          }
        } catch (err) {
          console.error(`Check failed for ${ip}/${tool}:`, err);
        }
      }
    }

    // Update asset stats
    const allStatuses: string[] = [];
    let totalFlagged = 0;
    let totalCount = 0;
    for (const ip of cidrIps) {
      const s = getChildIpStatus(ip);
      allStatuses.push(s.status);
      totalFlagged += s.flagged;
      totalCount += s.total;
    }
    let overallStatus: "clean" | "suspicious" | "threat" | "unknown" = "clean";
    if (allStatuses.some((s) => s === "threat")) overallStatus = "threat";
    else if (allStatuses.some((s) => s === "suspicious")) overallStatus = "suspicious";
    else if (totalCount === 0) overallStatus = "unknown";

    setAsset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        last_checked_at: new Date().toISOString(),
        last_status: overallStatus,
        checks_passed: totalCount - totalFlagged,
        checks_total: totalCount,
      };
    });

    setRunningChecks(false);
  };

  // ─── Run checks (non-CIDR) ─────────────────────────────────────────────────

  const handleRunAllChecks = async () => {
    if (!asset) return;
    setRunningChecks(true);

    const enabledChecks = Object.entries(asset.checks_enabled)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    setCheckProgress({ current: 0, total: enabledChecks.length });

    for (let i = 0; i < enabledChecks.length; i++) {
      const tool = enabledChecks[i];
      setCheckProgress({ current: i + 1, total: enabledChecks.length });

      try {
        const response = await fetch(`/api/assets/${id}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool }),
        });
        if (response.ok) {
          const data = await response.json();
          setResults((prev) => ({
            ...prev,
            [tool]: {
              id: data.saved ? "saved" : "",
              asset_id: id,
              tool_type: tool,
              result: data.result,
              status: data.status,
              checked_at: new Date().toISOString(),
            },
          }));
        }
      } catch (err) {
        console.error(`Check failed for ${tool}:`, err);
      }
    }

    // Re-fetch all results from the API to ensure tabs show persisted data
    await fetchAsset();

    setRunningChecks(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (response.ok) {
        router.push("/assets");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground">Asset not found</p>
        <Button onClick={() => router.push("/assets")} className="mt-4">
          Back to Assets
        </Button>
      </div>
    );
  }

  const flaggedCount = asset.checks_total - asset.checks_passed;
  const enabledCount = Object.values(asset.checks_enabled).filter(Boolean).length;
  const compatibleCheckCount = asset.type === "ip" ? 5 : asset.type === "cidr" ? 2 : 9;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/assets")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                {asset.type === "cidr" ? "CIDR" : asset.type.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-2", STATUS_BADGE_COLORS[asset.last_status])}
              >
                {STATUS_LABELS[asset.last_status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-sm text-muted-foreground">{asset.target}</p>
              <CopyButton value={asset.target} label="target" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border"
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={asset.type === "cidr" ? handleRunCidrAllChecks : handleRunAllChecks}
            disabled={runningChecks}
          >
            {runningChecks ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {asset.type === "cidr"
                  ? `Checking IP ${checkProgress.current} of ${checkProgress.total}`
                  : `Running ${checkProgress.current}/${checkProgress.total}`}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Re-run All Checks
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress bar during checks */}
      {runningChecks && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {asset.type === "cidr" ? "Checking IPs..." : "Running checks..."}
            </span>
            <span className="text-foreground">
              {checkProgress.current} of {checkProgress.total}
            </span>
          </div>
          <Progress
            value={(checkProgress.current / checkProgress.total) * 100}
            className="h-2 [&>div]:bg-primary"
          />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Shield}
          label="Last Status"
          value={asset.last_status.charAt(0).toUpperCase() + asset.last_status.slice(1)}
          variant={asset.last_status === "threat" ? "threat" : asset.last_status === "clean" ? "safe" : "default"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Checks Enabled"
          value={`${enabledCount} of ${compatibleCheckCount}`}
        />
        <StatCard
          icon={Timer}
          label="Last Checked"
          value={relativeTime(asset.last_checked_at)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Checks Flagged"
          value={`${flaggedCount}/${asset.checks_total}`}
          variant={flaggedCount > 0 ? "threat" : "safe"}
        />
      </div>

      {/* Blacklist History Chart — only for non-CIDR IPs */}
      {asset.type === "ip" && blacklistHistory.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <List className="h-4 w-4 text-primary" />
              Blacklist History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BlacklistChart data={blacklistHistory} />
          </CardContent>
        </Card>
      )}

      {/* CIDR Child IP Grid */}
      {asset.type === "cidr" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Child IPs ({cidrIps.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cidrIps.map((ip) => {
              const ipStatus = getChildIpStatus(ip);
              const hasResults = ipStatus.total > 0;
              return (
                <Card
                  key={ip}
                  className="border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-mono text-sm font-bold text-foreground">{ip}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0",
                          CHILD_STATUS_BADGE[hasResults ? ipStatus.status : "unknown"]
                        )}
                      >
                        {hasResults
                          ? ipStatus.status.charAt(0).toUpperCase() + ipStatus.status.slice(1)
                          : "Never Scanned"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      {ipStatus.checked_at ? `Last checked: ${relativeTime(ipStatus.checked_at)}` : "Never scanned"}
                    </p>
                    {hasResults && (
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Checks flagged</span>
                          <span className={cn("font-semibold", ipStatus.flagged > 0 ? "text-red-500" : "text-green-500")}>
                            {ipStatus.flagged}/{ipStatus.total}
                          </span>
                        </div>
                        <Progress
                          value={ipStatus.total > 0 ? (ipStatus.flagged / ipStatus.total) * 100 : 0}
                          className={cn("h-1.5", ipStatus.flagged > 0 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500")}
                        />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs border-border"
                      onClick={() => setSelectedChildIp(ip)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabbed Results — only for non-CIDR assets */}
      {asset.type !== "cidr" && (() => {
        const compatibleTabs = TOOL_TABS.filter(
          (t) => !INCOMPATIBLE_CHECKS[asset.type]?.includes(t.key)
        );
        return (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="border-border bg-secondary">
              {compatibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  disabled={!asset.checks_enabled[tab.key]}
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {compatibleTabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <TabContent
                  toolType={tab.key}
                  result={results[tab.key]}
                  enabled={asset.checks_enabled[tab.key] ?? true}
                />
              </TabsContent>
            ))}
          </Tabs>
        );
      })()}

      {/* Sheet — Child IP Detail */}
      <Sheet
        open={!!selectedChildIp}
        onOpenChange={(open: boolean) => { if (!open) setSelectedChildIp(null); }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg border-border bg-card overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono text-foreground">{selectedChildIp || ""}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Scan results for this IP
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <Button
              size="sm"
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => selectedChildIp && handleRunChildIpChecks(selectedChildIp)}
              disabled={childRunningChecks || !selectedChildIp}
            >
              {childRunningChecks ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Re-run Checks</>
              )}
            </Button>

            {selectedChildIp && (() => {
              const compatibleTabs = TOOL_TABS.filter(
                (t) => !INCOMPATIBLE_CHECKS[asset?.type || ""]?.includes(t.key)
              );
              return (
                <Tabs defaultValue="ip_lookup" className="space-y-4">
                  <TabsList className="border-border bg-secondary flex-wrap">
                    {compatibleTabs.map((tab) => {
                      const childResults = getChildIpTabResults(selectedChildIp);
                      const hasResult = !!childResults[tab.key];
                      return (
                        <TabsTrigger
                          key={tab.key}
                          value={tab.key}
                          disabled={!asset?.checks_enabled[tab.key]}
                          className={cn(
                            "data-[state=active]:bg-card data-[state=active]:text-foreground text-[10px] px-2",
                            hasResult && "text-green-500"
                          )}
                        >
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {compatibleTabs.map((tab) => {
                    const childResults = getChildIpTabResults(selectedChildIp);
                    return (
                      <TabsContent key={tab.key} value={tab.key}>
                        <TabContent
                          toolType={tab.key}
                          result={childResults[tab.key]}
                          enabled={asset?.checks_enabled[tab.key] ?? true}
                        />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              );
            })()}
            </div>
          </SheetContent>
        </Sheet>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AddAssetDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onCreated={() => { fetchAsset(); setEditDialogOpen(false); }}
          initialData={asset}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Asset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{asset.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}