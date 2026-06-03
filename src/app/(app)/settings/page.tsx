"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

// ─── Discord icon SVG ─────────────────────────────────────────────────────────
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

// ─── Slack icon SVG ────────────────────────────────────────────────────────────
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

// ─── Discord embed preview ─────────────────────────────────────────────────────
function DiscordPreview() {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[#313338] text-[13px] font-sans">
      {/* Server / channel chrome */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
            TS
          </div>
          <div>
            <span className="font-semibold text-white text-xs">ThreatSnipe</span>
            <span className="ml-2 text-[10px] text-[#6d6f78]">Today at 4:20 PM</span>
          </div>
        </div>

        {/* Embed */}
        <div className="rounded border-l-4 border-[#ff3b3b] bg-[#2b2d31] px-3 py-3 ml-10">
          <p className="font-semibold text-white text-[13px] mb-0.5">
            🔴 IP Threat Detected
          </p>
          <p className="text-[#b5bac1] text-[12px] mb-3">
            High abuse confidence score on scanned IP
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3">
            {[
              { label: "Target", value: "185.220.101.45" },
              { label: "Severity", value: "🔴 CRITICAL" },
              { label: "​", value: "​" },
              { label: "Abuse Score", value: "95/100" },
              { label: "Country", value: "RU" },
              { label: "ISP", value: "Tor Exit Node" },
            ].map((f, i) => (
              <div key={i}>
                <p className="text-[11px] font-semibold text-[#b5bac1] uppercase tracking-wide mb-0.5">
                  {f.label}
                </p>
                <p className="text-[12px] text-white font-mono">{f.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#6d6f78] mt-2">
            ThreatSnipe • Threat Intelligence
          </p>
        </div>
      </div>
      <div className="px-4 pt-1 pb-3 ml-10 text-[10px] text-[#6d6f78]">
        Discord will show a link preview for the re-scan URL
      </div>
    </div>
  );
}

// ─── Slack message preview ─────────────────────────────────────────────────────
function SlackPreview() {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[#1a1d21] text-[13px] font-sans">
      <div className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            TS
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-[13px]">ThreatSnipe</span>
              <span className="text-[10px] text-[#6d6f78]">4:20 PM</span>
            </div>

            {/* Header block */}
            <div className="bg-[#222529] rounded-t px-3 py-2 border-b border-white/10">
              <p className="font-bold text-white text-[13px]">
                🔴 CRITICAL — IP Threat Detected
              </p>
            </div>

            {/* Section block */}
            <div className="bg-[#222529] px-3 py-2 border-b border-white/10">
              <p className="text-white text-[12px]">
                <span className="font-semibold">IP Threat: 185.220.101.45</span>
              </p>
              <p className="text-[#b5bac1] text-[11px] mt-0.5 font-mono">
                Target: 185.220.101.45
              </p>
            </div>

            {/* Details section */}
            <div className="bg-[#222529] px-3 py-2 border-b border-white/10">
              <p className="text-[#b5bac1] text-[11px]">
                <span className="font-semibold text-white">Abuse Score:</span> 95/100  ·{" "}
                <span className="font-semibold text-white">Country:</span> RU  ·{" "}
                <span className="font-semibold text-white">ISP:</span> Tor Exit Node
              </p>
            </div>

            {/* Action block */}
            <div className="bg-[#222529] px-3 py-2 rounded-b">
              <button className="text-[11px] font-semibold px-3 py-1 rounded bg-[#cc0000] text-white hover:bg-[#aa0000] transition-colors">
                Re-scan →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Channel card ─────────────────────────────────────────────────────────────

type TestState = "idle" | "loading" | "success" | "error";

function ChannelCard({
  platform,
  url,
  onUrlChange,
  onTest,
  testState,
  saved,
}: {
  platform: "discord" | "slack";
  url: string;
  onUrlChange: (v: string) => void;
  onTest: () => void;
  testState: TestState;
  saved: boolean;
}) {
  const isDiscord = platform === "discord";
  const Icon = isDiscord ? DiscordIcon : SlackIcon;
  const iconColor = isDiscord ? "text-[#5865f2]" : "text-[#4a154b]";
  const iconBg = isDiscord ? "bg-[#5865f2]/10" : "bg-[#4a154b]/10";
  const placeholder = isDiscord
    ? "https://discord.com/api/webhooks/…"
    : "https://hooks.slack.com/services/…";
  const label = isDiscord ? "Discord" : "Slack";

  const isActive = saved && url.trim().length > 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">Incoming Webhook</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-2 py-0 h-5",
            isActive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-border text-muted-foreground"
          )}
        >
          {isActive ? (
            <span className="flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <WifiOff className="h-2.5 w-2.5" /> Not configured
            </span>
          )}
        </Badge>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Webhook URL
          </label>
          <Input
            type="url"
            placeholder={placeholder}
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="font-mono text-xs border-border/70 bg-secondary/40 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testState === "loading" || !url.trim()}
          className={cn(
            "h-8 gap-2 text-xs border-border/70",
            testState === "success" && "border-green-500/40 text-green-400",
            testState === "error" && "border-red-500/40 text-red-400"
          )}
        >
          {testState === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : testState === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          ) : testState === "error" ? (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {testState === "loading"
            ? "Sending…"
            : testState === "success"
            ? "Delivered!"
            : testState === "error"
            ? "Failed — check URL"
            : "Send test message"}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [discordUrl, setDiscordUrl] = useState("");
  const [slackUrl, setSlackUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDiscord, setSavedDiscord] = useState("");
  const [savedSlack, setSavedSlack] = useState("");
  const [discordTest, setDiscordTest] = useState<TestState>("idle");
  const [slackTest, setSlackTest] = useState<TestState>("idle");
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [previewTab, setPreviewTab] = useState<"discord" | "slack">("discord");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("user_settings")
        .select("slack_webhook_url, discord_webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const d = data.discord_webhook_url ?? "";
        const s = data.slack_webhook_url ?? "";
        setDiscordUrl(d);
        setSlackUrl(s);
        setSavedDiscord(d);
        setSavedSlack(s);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    setSaveState("idle");

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        discord_webhook_url: discordUrl.trim() || null,
        slack_webhook_url: slackUrl.trim() || null,
      },
      { onConflict: "user_id" }
    );

    setSaving(false);

    if (error) {
      setSaveState("error");
    } else {
      setSaveState("success");
      setSavedDiscord(discordUrl.trim());
      setSavedSlack(slackUrl.trim());
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const handleTest = async (platform: "discord" | "slack") => {
    const setter = platform === "discord" ? setDiscordTest : setSlackTest;
    const url = platform === "discord" ? discordUrl : slackUrl;
    if (!url.trim()) return;

    setter("loading");

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _test: true,
          discordUrl: platform === "discord" ? url.trim() : undefined,
          slackUrl: platform === "slack" ? url.trim() : undefined,
        }),
      });

      const data = await res.json();
      const channelResult = data?.result?.[platform];
      setter(channelResult === "sent" ? "success" : "error");
    } catch {
      setter("error");
    }

    setTimeout(() => setter("idle"), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDirty = discordUrl !== savedDiscord || slackUrl !== savedSlack;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-foreground">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure where ThreatSnipe sends your security alerts.
        </p>
      </div>

      {/* Alert channels */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Alert Channels</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Alerts fire automatically when IP threats, malicious domains, or high-risk ports are detected.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <ChannelCard
            platform="discord"
            url={discordUrl}
            onUrlChange={setDiscordUrl}
            onTest={() => handleTest("discord")}
            testState={discordTest}
            saved={!!savedDiscord}
          />
          <ChannelCard
            platform="slack"
            url={slackUrl}
            onUrlChange={setSlackUrl}
            onTest={() => handleTest("slack")}
            testState={slackTest}
            saved={!!savedSlack}
          />
        </motion.div>

        {/* Save button */}
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={cn(
              "gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
              saveState === "success" && "bg-green-600 hover:bg-green-700",
              saveState === "error" && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : saveState === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Saved
              </>
            ) : saveState === "error" ? (
              <>
                <XCircle className="h-4 w-4" /> Error — try again
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Webhooks
              </>
            )}
          </Button>
          {isDirty && saveState === "idle" && (
            <p className="text-xs text-muted-foreground">Unsaved changes</p>
          )}
        </div>
      </section>

      {/* Notification preview */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Notification Preview</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This is exactly what your team will see when a critical threat is detected.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 rounded-lg bg-secondary/60 border border-border/40 p-1 w-fit mb-4">
          {(["discord", "slack"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPreviewTab(tab)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                previewTab === tab
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "discord" ? (
                <DiscordIcon className="h-3 w-3 text-[#5865f2]" />
              ) : (
                <SlackIcon className="h-3 w-3 text-[#4a154b]" />
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <motion.div
          key={previewTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {previewTab === "discord" ? <DiscordPreview /> : <SlackPreview />}
        </motion.div>
      </section>

      {/* How to get webhook URLs */}
      <section className="rounded-xl border border-border/50 bg-secondary/20 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          How to get your webhook URL
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#5865f2] font-medium mb-1">
              <DiscordIcon className="h-3.5 w-3.5" />
              Discord
            </div>
            <p>1. Open your Discord server settings</p>
            <p>2. Go to <span className="font-mono text-foreground">Integrations → Webhooks</span></p>
            <p>3. Click <span className="font-mono text-foreground">New Webhook</span></p>
            <p>4. Choose your channel and copy the URL</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-medium mb-1" style={{ color: "#4a154b" }}>
              <SlackIcon className="h-3.5 w-3.5" />
              Slack
            </div>
            <p>1. Go to <span className="font-mono text-foreground">api.slack.com/apps</span></p>
            <p>2. Create an app → <span className="font-mono text-foreground">Incoming Webhooks</span></p>
            <p>3. Activate and add to your workspace</p>
            <p>4. Choose a channel and copy the Webhook URL</p>
          </div>
        </div>
      </section>
    </div>
  );
}
