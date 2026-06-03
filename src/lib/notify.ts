import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertCategory = "ip_threat" | "malicious_domain" | "port_risk";

export interface AlertPayload {
  userId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  target: string;
  details: Record<string, string | number>;
  rescanPath?: string;
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

const CATEGORY_LABEL: Record<AlertCategory, string> = {
  ip_threat: "IP Threat Detected",
  malicious_domain: "Malicious Domain Detected",
  port_risk: "High-Risk Ports Open",
};

// Discord embed colors (integer form of hex)
const DISCORD_COLORS: Record<AlertSeverity, number> = {
  critical: 0xff3b3b,
  high: 0xff7a00,
  medium: 0xf5b800,
  low: 0x3b82f6,
};

// ─── Discord ─────────────────────────────────────────────────────────────────

function buildDiscordPayload(payload: AlertPayload): object {
  const { severity, category, title, target, details, rescanPath } = payload;
  const emoji = SEVERITY_EMOJI[severity];
  const catLabel = CATEGORY_LABEL[category];

  const fields = [
    { name: "Target", value: `\`${target}\``, inline: true },
    { name: "Severity", value: `${emoji} ${SEVERITY_LABEL[severity]}`, inline: true },
    { name: "​", value: "​", inline: true }, // spacer
    ...Object.entries(details).map(([key, val]) => ({
      name: key,
      value: String(val),
      inline: true,
    })),
  ];

  const embed: Record<string, unknown> = {
    title: `${emoji} ${catLabel}`,
    description: title,
    color: DISCORD_COLORS[severity],
    fields,
    footer: { text: "ThreatSnipe • Threat Intelligence" },
    timestamp: new Date().toISOString(),
  };

  if (rescanPath) {
    embed.url = `https://app.threatsnipe.io${rescanPath}`;
  }

  return { embeds: [embed] };
}

// ─── Slack ────────────────────────────────────────────────────────────────────

function buildSlackPayload(payload: AlertPayload): object {
  const { severity, category, title, target, details, rescanPath } = payload;
  const emoji = SEVERITY_EMOJI[severity];
  const sevLabel = SEVERITY_LABEL[severity];
  const catLabel = CATEGORY_LABEL[category];

  const detailText = Object.entries(details)
    .map(([k, v]) => `*${k}:* ${v}`)
    .join("  ·  ");

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${sevLabel} — ${catLabel}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${title}*\nTarget: \`${target}\``,
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

  if (rescanPath) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Re-scan →", emoji: true },
          url: `https://app.threatsnipe.io${rescanPath}`,
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

async function sendToDiscord(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
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

/**
 * Fetch webhook URLs from user_settings and fire notifications
 * to any configured channels. Non-blocking — errors are swallowed.
 */
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
    // Never throw — this is fire-and-forget
  }

  return result;
}

/**
 * Send a test notification to explicit webhook URLs (no DB lookup).
 * Used by the settings page test button.
 */
export async function sendTestNotification(
  discordWebhookUrl: string | null,
  slackWebhookUrl: string | null
): Promise<NotifyResult> {
  const testPayload: AlertPayload = {
    userId: "test",
    severity: "critical",
    category: "ip_threat",
    title: "Test alert from ThreatSnipe",
    target: "185.220.101.45",
    details: {
      "Abuse Score": "95/100",
      Country: "RU",
      ISP: "Tor Exit Node",
      Reports: "847",
    },
    rescanPath: "/lookup",
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
