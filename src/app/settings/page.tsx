"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [slackUrl, setSlackUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("slack_webhook_url, discord_webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        if (data.slack_webhook_url) setSlackUrl(data.slack_webhook_url);
        if (data.discord_webhook_url) setDiscordUrl(data.discord_webhook_url);
      }
      setLoading(false);
    }
    loadSettings();
  }, [supabase, router]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      slack_webhook_url: slackUrl || null,
      discord_webhook_url: discordUrl || null,
    }, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Webhook URLs saved successfully." });
    }
  };

  const testWebhook = async (type: "slack" | "discord") => {
    const url = type === "slack" ? slackUrl : discordUrl;
    if (!url) {
      setMessage({ type: "error", text: `Please enter a ${type} webhook URL first.` });
      return;
    }

    if (type === "slack") setTestingSlack(true);
    else setTestingDiscord(true);
    setMessage(null);

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: "0.0.0.0",
          abuseScore: 85,
          country: "US",
          isp: "Test ISP",
          threatLevel: "THREAT",
          userId: null,
          _test: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Test message sent to ${type === "slack" ? "Slack" : "Discord"} successfully!`,
        });
      } else {
        setMessage({ type: "error", text: data.error || `Failed to send test to ${type}.` });
      }
    } catch {
      setMessage({ type: "error", text: `Failed to connect to ${type} webhook.` });
    } finally {
      if (type === "slack") setTestingSlack(false);
      else setTestingDiscord(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your Centry alert preferences.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Alert Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Slack Webhook URL
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhook("slack")}
                disabled={testingSlack || !slackUrl}
                className="flex-shrink-0"
              >
                {testingSlack ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Test
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Discord Webhook URL
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhook("discord")}
                disabled={testingDiscord || !discordUrl}
                className="flex-shrink-0"
              >
                {testingDiscord ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Test
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Webhooks
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}