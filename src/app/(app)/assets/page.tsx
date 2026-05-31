"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
  Monitor,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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

interface UserSettings {
  slack_webhook?: string;
  discord_webhook?: string;
  check_interval?: string;
  alert_severities?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECK_OPTIONS: { key: string; label: string }[] = [
  { key: "ip_lookup", label: "IP Lookup" },
  { key: "domain_lookup", label: "Domain Lookup" },
  { key: "port_scan", label: "Port Scanner" },
  { key: "blacklist", label: "Blacklist Check (DNSBL)" },
  { key: "dns_records", label: "DNS Records" },
  { key: "whois", label: "WHOIS Lookup" },
  { key: "ssl", label: "SSL Certificate" },
  { key: "email_security", label: "Email Security (SPF/DKIM/DMARC)" },
  { key: "server_status", label: "Server Status" },
  { key: "bulk_check", label: "Bulk Check" },
];

const CHECK_INTERVALS = [
  { value: "default", label: "Use default (from Settings)" },
  { value: "15min", label: "Every 15 min" },
  { value: "30min", label: "Every 30 min" },
  { value: "1hour", label: "Every 1 hour" },
  { value: "3hours", label: "Every 3 hours" },
  { value: "6hours", label: "Every 6 hours" },
  { value: "12hours", label: "Every 12 hours" },
  { value: "24hours", label: "Every 24 hours" },
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
  bulk_check: "BULK",
};

// ─── Detection Helpers ────────────────────────────────────────────────────────

function detectType(target: string): "ip" | "domain" | "hostname" {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = target.match(ipv4Regex);
  if (ipv4Match) {
    const valid = ipv4Match.slice(1).every((o) => {
      const n = parseInt(o, 10);
      return n >= 0 && n <= 255;
    });
    if (valid) return "ip";
  }
  if (target.includes(".") && !target.includes(" ")) return "domain";
  return "hostname";
}

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

// ─── Add Asset Dialog ─────────────────────────────────────────────────────────

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
  const [name, setName] = useState(initialData?.name || "");
  const [target, setTarget] = useState(initialData?.target || "");
  const [type, setType] = useState<"ip" | "domain" | "hostname">(
    initialData?.type || "domain"
  );
  const [checks, setChecks] = useState<Record<string, boolean>>(
    initialData?.checks_enabled || {
      ip_lookup: true,
      domain_lookup: true,
      port_scan: true,
      blacklist: true,
      dns_records: true,
      whois: true,
      ssl: true,
      email_security: true,
      server_status: true,
      bulk_check: true,
    }
  );
  const [monitoringEnabled, setMonitoringEnabled] = useState(
    initialData?.monitoring_enabled || false
  );
  const [checkInterval, setCheckInterval] = useState(
    initialData?.check_interval || "default"
  );
  const [alertsEnabled, setAlertsEnabled] = useState(
    initialData?.alerts_enabled || false
  );
  const [alertSevCritical, setAlertSevCritical] = useState(
    initialData?.alert_severities?.includes("critical") ?? true
  );
  const [alertSevHigh, setAlertSevHigh] = useState(
    initialData?.alert_severities?.includes("high") ?? true
  );
  const [alertSevMedium, setAlertSevMedium] = useState(
    initialData?.alert_severities?.includes("medium") ?? false
  );
  const [alertSlack, setAlertSlack] = useState(
    initialData?.alert_channels?.includes("slack") ?? false
  );
  const [alertDiscord, setAlertDiscord] = useState(
    initialData?.alert_channels?.includes("discord") ?? false
  );
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const supabase = createClient();

  // Auto-detect type when target changes
  useEffect(() => {
    if (target) {
      setType(detectType(target));
    }
  }, [target]);

  // Fetch user settings for default values
  useEffect(() => {
    if (!open) return;
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setUserSettings(data);
      }
    };
    fetchSettings();
  }, [open, supabase]);

  const isFormValid = name.trim().length > 0 && target.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setSaving(true);

    const severities: string[] = [];
    if (alertSevCritical) severities.push("critical");
    if (alertSevHigh) severities.push("high");
    if (alertSevMedium) severities.push("medium");

    const channels: string[] = [];
    if (alertSlack) channels.push("slack");
    if (alertDiscord) channels.push("discord");

    // Build the payload — for editing we PATCH, for creating we POST
    const payload = {
      name: name.trim(),
      target: target.trim(),
      type,
      checks_enabled: checks,
      monitoring_enabled: monitoringEnabled,
      check_interval: checkInterval,
      alerts_enabled: alertsEnabled,
      alert_severities: severities,
      alert_channels: channels,
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

  const slackConfigured = userSettings?.slack_webhook;
  const discordConfigured = userSettings?.discord_webhook;
  const hasWebhookConfig = slackConfigured || discordConfigured;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!initialData && (
        <DialogTrigger>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {initialData ? "Edit Asset" : "Add Asset"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="asset-name" className="text-sm text-foreground">
              Name
            </Label>
            <Input
              id="asset-name"
              placeholder="e.g. Production Web Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>

          {/* Target + Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="asset-target" className="text-sm text-foreground">
                Target
              </Label>
              <Input
                id="asset-target"
                placeholder="IP or domain"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Type</Label>
              <Select
                value={type}
                onValueChange={(v: string | null) => v && setType(v as "ip" | "domain" | "hostname")}
              >
                <SelectTrigger className="border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="ip">IP</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="hostname">Hostname</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checks to Run */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Checks to Run</Label>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              {CHECK_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={checks[option.key] ?? true}
                    onCheckedChange={(checked) =>
                      setChecks((prev) => ({
                        ...prev,
                        [option.key]: checked === true,
                      }))
                    }
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Enable Monitoring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Enable Monitoring
                </Label>
              </div>
              <Switch
                checked={monitoringEnabled}
                onCheckedChange={setMonitoringEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            {/* Animated sub-section */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                monitoringEnabled ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4">
                <Label className="text-sm text-foreground">Check Interval</Label>
                <Select
                  value={checkInterval}
                  onValueChange={(v: string | null) => v && setCheckInterval(v)}
                >
                  <SelectTrigger className="border-border bg-secondary text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {CHECK_INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enable Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Enable Alerts
                </Label>
              </div>
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            {/* Animated sub-section */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                alertsEnabled ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
                {/* Alert on */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Alert on</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alertSevCritical}
                        onCheckedChange={(c) => setAlertSevCritical(c === true)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <span className="text-sm text-foreground">Critical</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alertSevHigh}
                        onCheckedChange={(c) => setAlertSevHigh(c === true)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <span className="text-sm text-foreground">High</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alertSevMedium}
                        onCheckedChange={(c) => setAlertSevMedium(c === true)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <span className="text-sm text-foreground">Medium</span>
                    </label>
                  </div>
                </div>

                {/* Notify via */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Notify via</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alertSlack}
                        onCheckedChange={(c) => setAlertSlack(c === true)}
                        disabled={!slackConfigured}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-50"
                      />
                      <span className={cn("text-sm", !slackConfigured ? "text-muted-foreground" : "text-foreground")}>
                        Slack webhook
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alertDiscord}
                        onCheckedChange={(c) => setAlertDiscord(c === true)}
                        disabled={!discordConfigured}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-50"
                      />
                      <span className={cn("text-sm", !discordConfigured ? "text-muted-foreground" : "text-foreground")}>
                        Discord webhook
                      </span>
                    </label>
                  </div>
                  {!hasWebhookConfig && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No webhooks configured.{" "}
                      <a href="/settings" className="text-primary hover:underline">
                        Configure in Settings →
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-border"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData ? (
              "Save Changes"
            ) : (
              "Submit"
            )}
          </Button>
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
  const borderClass = STATUS_BORDER_COLORS[asset.last_status] || STATUS_BORDER_COLORS.unknown;

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
        {/* Top row: name + status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">
              {asset.name}
            </p>
            <p className="font-mono text-sm text-muted-foreground truncate mt-0.5">
              {asset.target}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "ml-2 shrink-0 text-[10px] px-2 py-0",
              STATUS_BADGE_COLORS[asset.last_status]
            )}
          >
            {asset.last_status.charAt(0).toUpperCase() + asset.last_status.slice(1)}
          </Badge>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant="outline"
            className="border-border text-[10px] text-muted-foreground px-2 py-0"
          >
            {asset.type.toUpperCase()}
          </Badge>
          {asset.monitoring_enabled && (
            <Badge
              variant="outline"
              className="border-green-500/30 bg-green-500/10 text-[10px] text-green-500 px-2 py-0"
            >
              Monitoring
            </Badge>
          )}
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
              flaggedCount > 0 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
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
      setAssets(data);
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
    // Navigate to detail page which handles running checks
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