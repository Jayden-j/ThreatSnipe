import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertCheckType =
  | "ip_lookup"
  | "domain_lookup"
  | "port_scan"
  | "blacklist"
  | "ssl"
  | "dns_records"
  | "whois"
  | "email_security"
  | "server_status";

export interface AlertPayload {
  userId: string;
  severity: AlertSeverity;
  checkType: AlertCheckType;
  assetName: string;
  assetTarget: string;
  title: string;
  details: Record<string, string | number>;
  assetPath?: string;
}

export type NotifyResult = {
  discord: "sent" | "skipped" | "error";
  slack: "sent" | "skipped" | "error";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const CHECK_TYPE_LABEL: Record<AlertCheckType, string> = {
  ip_lookup: "IP Lookup",
  domain_lookup: "Domain Scan",
  port_scan: "Port Scan",
  blacklist: "Blacklist Check",
  ssl: "SSL Certificate",
  dns_records: "DNS Records",
  whois: "WHOIS",
  email_security: "Email Security",
  server_status: "Server Status",
};

const DISCORD_COLORS: Record<AlertSeverity, number> = {
  critical: 0xff3b3b,
  high: 0xff7a00,
  medium: 0xf5b800,
  low: 0x3b82f6,
};

// ─── Discord ──────────────────────────────────────────────────────────────────

function buildDiscordPayload(payload: AlertPayload): object {
  const { severity, checkType, assetName, assetTarget, title, details, assetPath } = payload;
  const emoji = SEVERITY_EMOJI[severity];
  const checkLabel = CHECK_TYPE_LABEL[checkType];

  const fields = [
    { name: "Asset", value: `**${assetName}**`, inline: true },
    { name: "Target", value: `\`${assetTarget}\``, inline: true },
    { name: "Check", value: checkLabel, inline: true },
    { name: "Severity", value: `${emoji} ${SEVERITY_LABEL[severity]}`, inline: true },
    ...Object.entries(details).map(([key, val]) => ({
      name: key,
      value: String(val),
      inline: true,
    })),
  ];

  const embed: Record<string, unknown> = {
    title: `${emoji} ${SEVERITY_LABEL[severity]} — ${checkLabel}`,
    description: title,
    color: DISCORD_COLORS[severity],
    fields,
    footer: { text: "ThreatSnipe • Threat Intelligence" },
    timestamp: new Date().toISOString(),
  };

  if (assetPath) {
    embed.url = `https://app.threatsnipe.io${assetPath}`;
  }

  return { embeds: [embed] };
}

// ─── Slack ────────────────────────────────────────────────────────────────────

function buildSlackPayload(payload: AlertPayload): object {
  const { severity, checkType, assetName, assetTarget, title, details, assetPath } = payload;
  const emoji = SEVERITY_EMOJI[severity];
  const sevLabel = SEVERITY_LABEL[severity];
  const checkLabel = CHECK_TYPE_LABEL[checkType];

  const detailText = Object.entries(details)
    .map(([k, v]) => `*${k}:* ${v}`)
    .join("  ·  ");

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${sevLabel} — ${checkLabel}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${title}*\nAsset: *${assetName}*  ·  Target: \`${assetTarget}\``,
      },
    },
  ];

  if (detailText) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: detailText },
    });
  }

  blocks.push({ type: "divider" });

  if (assetPath) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Asset →", emoji: true },
          url: `https://app.threatsnipe.io${assetPath}`,
          style: severity === "critical" || severity === "high" ? "danger" : "primary",
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `ThreatSnipe Threat Intelligence  ·  ${new Date().toUTCString()}`,
      },
    ],
  });

  return { blocks };
}

// ─── Core send functions ──────────────────────────────────────────────────────

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "discord.com" || parsed.hostname === "hooks.slack.com")
    );
  } catch {
    return false;
  }
}

async function sendToDiscord(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
  if (!isAllowedWebhookUrl(webhookUrl)) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiscordPayload(payload)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendToSlack(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
  if (!isAllowedWebhookUrl(webhookUrl)) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(payload)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendAlertNotification(payload: AlertPayload): Promise<NotifyResult> {
  const result: NotifyResult = { discord: "skipped", slack: "skipped" };

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("user_settings")
      .select("discord_webhook_url, slack_webhook_url")
      .eq("user_id", payload.userId)
      .maybeSingle();

    if (!data) return result;

    const [discordOk, slackOk] = await Promise.all([
      data.discord_webhook_url
        ? sendToDiscord(data.discord_webhook_url, payload)
        : Promise.resolve(null),
      data.slack_webhook_url
        ? sendToSlack(data.slack_webhook_url, payload)
        : Promise.resolve(null),
    ]);

    result.discord = data.discord_webhook_url
      ? discordOk ? "sent" : "error"
      : "skipped";

    result.slack = data.slack_webhook_url
      ? slackOk ? "sent" : "error"
      : "skipped";
  } catch {
    // Never throw — fire-and-forget
  }

  return result;
}

export async function sendTestNotification(
  discordWebhookUrl: string | null,
  slackWebhookUrl: string | null
): Promise<NotifyResult> {
  const testPayload: AlertPayload = {
    userId: "test",
    severity: "critical",
    checkType: "ip_lookup",
    assetName: "prod-server-01",
    assetTarget: "185.220.101.45",
    title: "Test alert from ThreatSnipe",
    details: {
      "Abuse Score": "95/100",
      Country: "RU",
      ISP: "Tor Exit Node",
      Reports: "847",
    },
    assetPath: "/assets",
  };

  const result: NotifyResult = { discord: "skipped", slack: "skipped" };

  const [discordOk, slackOk] = await Promise.all([
    discordWebhookUrl ? sendToDiscord(discordWebhookUrl, testPayload) : Promise.resolve(null),
    slackWebhookUrl ? sendToSlack(slackWebhookUrl, testPayload) : Promise.resolve(null),
  ]);

  result.discord = discordWebhookUrl
    ? discordOk ? "sent" : "error"
    : "skipped";

  result.slack = slackWebhookUrl
    ? slackOk ? "sent" : "error"
    : "skipped";

  return result;
}
