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

import dynamic from "next/dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  target: string;
  type: "ip" | "domain" | "hostname";
  checks_enabled: Record<string, boolean>;
  monitoring_enabled: boolean;
  check_interval: string;
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
  { key: "ip_lookup", label: "IP Lookup" },
  { key: "domain_lookup", label: "Domain" },
  { key: "port_scan", label: "Port Scan" },
  { key: "blacklist", label: "Blacklist" },
  { key: "dns_records", label: "DNS Records" },
  { key: "whois", label: "WHOIS" },
  { key: "ssl", label: "SSL" },
  { key: "email_security", label: "Email Security" },
  { key: "server_status", label: "Server Status" },
];

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
  // Result likely contains port data
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

// ─── AddAssetDialog (reused from parent) ───────────────────────────────────────

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
  // Imported from the assets page - simplified version
  const router = useRouter();
  return null; // We'll render a simpler edit button instead
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

  const fetchAsset = useCallback(async () => {
    try {
      const response = await fetch(`/api/assets/${id}`);
      if (!response.ok) throw new Error("Failed to fetch asset");
      const data: AssetDetailResponse = await response.json();
      setAsset(data.asset);
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
    if (asset.type === "ip" || asset.type === "hostname") {
      fetchHistory();
    }
  }, [asset, id]);

  const handleRunAllChecks = async () => {
    if (!asset) return;
    setRunningChecks(true);

    const enabledChecks = Object.entries(asset.checks_enabled)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    setCheckProgress({ current: 0, total: enabledChecks.length });

    const newResults = { ...results };

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
          newResults[tool] = {
            id: data.saved ? "saved" : "",
            asset_id: id,
            tool_type: tool,
            result: data.result,
            status: data.status,
            checked_at: new Date().toISOString(),
          };
          setResults({ ...newResults });
        }
      } catch (err) {
        console.error(`Check failed for ${tool}:`, err);
      }
    }

    // Update asset stats after all checks
    const completedResults = Object.values(newResults).filter((r) => r.id || r.result);
    const flaggedCount = completedResults.filter((r) => r.status === "threat" || r.status === "suspicious").length;
    const totalCount = completedResults.length;

    // Determine overall status
    let overallStatus: "clean" | "suspicious" | "threat" | "unknown" = "unknown";
    const threatCount = completedResults.filter((r) => r.status === "threat").length;
    const suspiciousCount = completedResults.filter((r) => r.status === "suspicious").length;
    if (threatCount > 0) overallStatus = "threat";
    else if (suspiciousCount > 0) overallStatus = "suspicious";
    else if (totalCount > 0) overallStatus = "clean";

    // Update asset in local state
    setAsset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        last_checked_at: new Date().toISOString(),
        last_status: overallStatus,
        checks_passed: totalCount - flaggedCount,
        checks_total: totalCount,
      };
    });

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
                {asset.type.toUpperCase()}
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
            onClick={handleRunAllChecks}
            disabled={runningChecks}
          >
            {runningChecks ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running {checkProgress.current}/{checkProgress.total}
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
            <span className="text-muted-foreground">Running checks...</span>
            <span className="text-foreground">{checkProgress.current} of {checkProgress.total}</span>
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
          value={`${enabledCount} of 10`}
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

      {/* Blacklist History Chart */}
      {(asset.type === "ip" || asset.type === "hostname") && blacklistHistory.length > 0 && (
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

      {/* Tabbed Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="border-border bg-secondary">
          {TOOL_TABS.map((tab) => (
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

        {TOOL_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <TabContent
              toolType={tab.key}
              result={results[tab.key]}
              enabled={asset.checks_enabled[tab.key] ?? true}
            />
          </TabsContent>
        ))}
      </Tabs>

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