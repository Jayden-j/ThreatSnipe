"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Shield,
  Plus,
  Search,
  Folder,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STATUS_BORDER_COLORS: Record<string, string> = {
  clean: "border-l-green-500",
  suspicious: "border-l-yellow-500",
  threat: "border-l-red-500",
  unknown: "border-l-gray-500",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  clean: "border-green-500/30 bg-green-500/10 text-green-500",
  suspicious: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  threat: "border-red-500/30 bg-red-500/10 text-red-500",
  unknown: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const CHECK_BADGE_SHORT: Record<string, string> = {
  ip_lookup: "IP",
  domain_lookup: "DNS",
  dns_records: "DNS",
  ssl: "SSL",
  email_security: "EMAIL",
  port_scan: "PORTS",
  server_status: "SERVER",
  blacklist: "BL",
  whois: "WHOIS",
};

// ─── Type compatibility for checks ────────────────────────────────────────────

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

// ─── Relative time ────────────────────────────────────────────────────────────

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

  // Reset step when dialog opens
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

  // Set step to 1 for edit mode when dialog opens
  useEffect(() => {
    if (open && initialData) {
      setStep(1);
      setSaving(false);
    }
  }, [open, initialData]);

  const disabledChecks = useMemo(() => {
    return INCOMPATIBLE_CHECKS[type] || [];
  }, [type]);

  // When type changes, uncheck any checks that are now disabled
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
  }, [disabledChecks]);

  const targetPlaceholder = useMemo(() => {
    if (type === "ip") return "e.g. 192.168.1.1";
    if (type === "domain") return "e.g. example.com";
    return "e.g. 192.168.1.0/24";
  }, [type]);

  const isStep1Valid =
    name.trim().length > 0 && target.trim().length > 0 && type.length > 0;

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
      alerts_enabled: false,
      alert_severities: [],
      alert_channels: [],
    };

    try {
      if (initialData?.id) {
        // Edit mode
        const response = await fetch(`/api/assets/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update asset");
      } else {
        // Create mode
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
      {!initialData && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" />
          }
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {initialData ? "Edit Asset" : "Add Asset"}
          </DialogTitle>
          {/* Step indicator */}
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
                <span
                  className={cn(
                    "text-xs",
                    step === s
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  Step {s} of 3
                </span>
                {s < 3 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1 — Asset Info */}
          {step === 1 && (
            <>
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="asset-name" className="text-sm text-foreground">
                  Name
                </Label>
                <Input
                  id="asset-name"
                  placeholder="e.g. My Web Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    v && setType(v as "ip" | "domain" | "cidr")
                  }
                >
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

              {/* Target */}
              <div className="space-y-2">
                <Label htmlFor="asset-target" className="text-sm text-foreground">
                  Target
                </Label>
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

          {/* Step 2 — Checks to Run */}
          {step === 2 && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Checks to Run</Label>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                {CHECK_OPTIONS.map((option) => {
                  const isDisabled = disabledChecks.includes(option.key);
                  return (
                    <label
                      key={option.key}
                      className={cn(
                        "flex items-center gap-2",
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <Checkbox
                        checked={checks[option.key] ?? false}
                        onCheckedChange={(checked) =>
                          setChecks((prev) => ({
                            ...prev,
                            [option.key]: checked === true,
                          }))
                        }
                        disabled={isDisabled}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-40"
                      />
                      <span
                        className={cn(
                          "text-sm",
                          isDisabled
                            ? "text-muted-foreground/40"
                            : "text-foreground"
                        )}
                      >
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Monitoring */}
          {step === 3 && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                How often to check this asset
              </Label>
              <Select
                value={String(checkInterval)}
                onValueChange={(v) => v && setCheckInterval(Number(v))}
              >
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {CHECK_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={String(interval.value)}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                className="border-border"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 && !isStep1Valid}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
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

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  onRunChecks,
}: {
  asset: Asset;
  onRunChecks: (id: string) => void;
}) {
  const router = useRouter();
  const flaggedCount = asset.checks_total - asset.checks_passed;
  const borderClass =
    STATUS_BORDER_COLORS[asset.last_status] || STATUS_BORDER_COLORS.unknown;
  const displayType = asset.type === "cidr" ? "CIDR" : asset.type.toUpperCase();

  return (
    <Card
      className={cn(
        "group border-border bg-card transition-all duration-300 hover:border-primary/50 cursor-pointer",
        "border-l-4",
        borderClass
      )}
      onClick={() => router.push(`/assets/${asset.id}`)}
    >
      <CardContent className="p-5">
        {/* Top row: icon + name + status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {asset.type === "cidr" && (
              <Folder className="h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {asset.name}
              </p>
              <p className="font-mono text-sm text-muted-foreground truncate mt-0.5">
                {asset.target}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "ml-2 shrink-0 text-[10px] px-2 py-0",
              STATUS_BADGE_COLORS[asset.last_status]
            )}
          >
            {asset.last_status.charAt(0).toUpperCase() +
              asset.last_status.slice(1)}
          </Badge>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant="outline"
            className="border-border text-[10px] text-muted-foreground px-2 py-0"
          >
            {displayType}
          </Badge>
        </div>

        {/* Threat summary */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Checks flagged</span>
            <span
              className={cn(
                "font-semibold",
                flaggedCount > 0 ? "text-red-500" : "text-green-500"
              )}
            >
              {flaggedCount}/{asset.checks_total}
            </span>
          </div>
          <Progress
            value={
              asset.checks_total > 0
                ? (flaggedCount / asset.checks_total) * 100
                : 0
            }
            className={cn(
              "h-1.5",
              flaggedCount > 0
                ? "[&>div]:bg-red-500"
                : "[&>div]:bg-green-500"
            )}
          />
        </div>

        {/* Check badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {CHECK_OPTIONS.slice(0, 8).map((opt) => {
            const enabled = asset.checks_enabled[opt.key] ?? true;
            const short = CHECK_BADGE_SHORT[opt.key] || opt.key;
            return (
              <Badge
                key={opt.key}
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0",
                  enabled
                    ? "border-border text-muted-foreground"
                    : "border-border/30 text-muted-foreground/40 line-through"
                )}
              >
                {short}
              </Badge>
            );
          })}
        </div>

        {/* Footer: last checked + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            {relativeTime(asset.last_checked_at)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-border"
              onClick={(e) => {
                e.stopPropagation();
                onRunChecks(asset.id);
              }}
            >
              Run Checks
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/assets/${asset.id}`);
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Assets Page ──────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch("/api/assets");
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      // Map hostname → ip for legacy assets
      setAssets(
        data.map((a: any) => ({
          ...a,
          type: a.type === "hostname" ? "ip" : a.type,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = assets.filter((asset) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        asset.name.toLowerCase().includes(q) ||
        asset.target.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Tab filter
    if (filterTab === "threat") return asset.last_status === "threat";
    if (filterTab === "suspicious") return asset.last_status === "suspicious";
    if (filterTab === "clean") return asset.last_status === "clean";
    return true;
  });

  const handleRunChecks = async (assetId: string) => {
    window.location.href = `/assets/${assetId}`;
  };

  const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "threat", label: "Threatened" },
    { key: "suspicious", label: "Suspicious" },
    { key: "clean", label: "Clean" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {assets.length} asset{assets.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <AddAssetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={fetchAssets}
        />
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filterTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Shield className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-foreground">
            {assets.length === 0 ? "No assets tracked" : "No matching assets"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {assets.length === 0
              ? "Add your first asset to start monitoring"
              : "Try adjusting your search or filter"}
          </p>
          {assets.length === 0 && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      )}

      {/* Asset cards grid */}
      {!loading && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onRunChecks={handleRunChecks}
            />
          ))}
        </div>
      )}
    </div>
  );
}