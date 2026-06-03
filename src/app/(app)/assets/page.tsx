"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const CHECK_BADGE_SHORT: Record<string, string> = {
  ip_lookup: "IP",
  domain_lookup: "VT",
  dns_records: "DNS",
  ssl: "SSL",
  email_security: "EMAIL",
  port_scan: "PORTS",
  server_status: "SRV",
  blacklist: "BL",
  whois: "WHOIS",
};

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

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  clean: {
    barColor: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.07)",
    dotClass: "bg-green-500",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-400",
    label: "Clean",
    pulse: false,
  },
  suspicious: {
    barColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.07)",
    dotClass: "bg-yellow-500",
    badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    label: "Suspicious",
    pulse: false,
  },
  threat: {
    barColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.10)",
    dotClass: "bg-red-500",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Threat",
    pulse: true,
  },
  unknown: {
    barColor: "#6b7280",
    glowColor: "rgba(107, 114, 128, 0.05)",
    dotClass: "bg-gray-500",
    badgeClass: "border-gray-500/30 bg-gray-500/10 text-gray-400",
    label: "Unknown",
    pulse: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function intervalLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = minutes / 60;
  return `${h}h`;
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  onRunChecks,
  index,
}: {
  asset: Asset;
  onRunChecks: (id: string) => void;
  index: number;
}) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[asset.last_status] ?? STATUS_CONFIG.unknown;
  const flaggedCount = asset.checks_total - asset.checks_passed;
  const healthPct = asset.checks_total > 0
    ? (asset.checks_passed / asset.checks_total) * 100
    : 100;
  const displayType = asset.type === "cidr" ? "CIDR" : asset.type.toUpperCase();

  const enabledChecks = CHECK_OPTIONS.filter(
    (opt) => asset.checks_enabled[opt.key] === true
  );

  const healthColor =
    flaggedCount === 0 ? "bg-green-500" : flaggedCount === 1 ? "bg-yellow-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: Math.min(index * 0.055, 0.38),
        ease: "easeOut",
      }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="group relative cursor-pointer rounded-xl border border-border/70 bg-card overflow-hidden"
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      }}
      onClick={() => router.push(`/assets/${asset.id}`)}
    >
      {/* Status color bar — top edge */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300"
        style={{ background: statusCfg.barColor }}
      />

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 50% at 50% -10%, ${statusCfg.glowColor}, transparent 70%)`,
        }}
      />

      <div className="relative p-5 pt-5">
        {/* Row 1: status dot + type + interval */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Animated status dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              {statusCfg.pulse && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70 animate-ping" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  statusCfg.dotClass
                )}
              />
            </span>
            {/* Type pill */}
            <span className="text-[9px] uppercase tracking-widest font-mono font-semibold text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
              {displayType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[9px] px-1.5 py-0 h-4", statusCfg.badgeClass)}
            >
              {statusCfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {relativeTime(asset.last_checked_at)}
            </span>
          </div>
        </div>

        {/* Row 2: Name */}
        <p className="font-semibold text-[15px] text-foreground leading-snug truncate mb-0.5">
          {asset.name}
        </p>

        {/* Row 3: Target */}
        <p className="font-mono text-xs text-muted-foreground truncate mb-4">
          {asset.target}
        </p>

        {/* Row 4: Health bar */}
        {asset.checks_total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground">Check health</span>
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  flaggedCount === 0
                    ? "text-green-400"
                    : flaggedCount === 1
                    ? "text-yellow-400"
                    : "text-red-400"
                )}
              >
                {asset.checks_passed}/{asset.checks_total} passed
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  healthColor
                )}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 5: Enabled check badges */}
        {enabledChecks.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-4">
            {enabledChecks.slice(0, 6).map((opt) => (
              <span
                key={opt.key}
                className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground bg-secondary/40 tracking-wide"
              >
                {CHECK_BADGE_SHORT[opt.key] || opt.key}
              </span>
            ))}
            {enabledChecks.length > 6 && (
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground bg-secondary/40">
                +{enabledChecks.length - 6}
              </span>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-[10px] text-muted-foreground/60 italic">No checks enabled</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground">
            Every {intervalLabel(asset.check_interval)}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2.5 text-[10px] text-muted-foreground hover:text-foreground border border-border/50 hover:bg-secondary/60 hover:border-border"
              onClick={(e) => {
                e.stopPropagation();
                onRunChecks(asset.id);
              }}
            >
              Run
            </Button>
            <Button
              size="sm"
              className="h-6 px-2.5 text-[10px] bg-primary/90 hover:bg-primary text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/assets/${asset.id}`);
              }}
            >
              View →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
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

  const disabledChecks = useMemo(() => INCOMPATIBLE_CHECKS[type] || [], [type]);

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
                    step === s ? "text-foreground font-medium" : "text-muted-foreground"
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
          {step === 1 && (
            <>
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
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => v && setType(v as "ip" | "domain" | "cidr")}
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
                          isDisabled ? "text-muted-foreground/40" : "text-foreground"
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
              <Button variant="outline" className="border-border" onClick={handleBack}>
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
    if (search) {
      const q = search.toLowerCase();
      if (
        !asset.name.toLowerCase().includes(q) &&
        !asset.target.toLowerCase().includes(q)
      )
        return false;
    }
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

  // Stats for the header
  const threatCount = assets.filter((a) => a.last_status === "threat").length;
  const suspCount = assets.filter((a) => a.last_status === "suspicious").length;
  const cleanCount = assets.filter((a) => a.last_status === "clean").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{assets.length} tracked</span>
            {threatCount > 0 && (
              <span className="text-red-400 font-medium">{threatCount} threatened</span>
            )}
            {suspCount > 0 && (
              <span className="text-yellow-400 font-medium">{suspCount} suspicious</span>
            )}
            {cleanCount > 0 && (
              <span className="text-green-400 font-medium">{cleanCount} clean</span>
            )}
          </div>
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
        <div className="flex gap-1 rounded-lg bg-secondary/60 border border-border/40 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl border border-border/40 bg-card"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredAssets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/60 border border-border/40">
            <Shield className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-foreground">
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
              className="mt-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </motion.div>
      )}

      {/* Asset grid */}
      {!loading && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset, index) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onRunChecks={handleRunChecks}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
