import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

interface NotifyRequest {
  ip: string;
  abuseScore: number;
  country: string;
  isp: string;
  threatLevel: string;
  userId: string | null;
  _test?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json();
    const { ip, abuseScore, country, isp, threatLevel, userId, _test } = body;

    // Only fire for THREAT level scans (unless it's a test)
    if (threatLevel !== "THREAT" && !_test) {
      return NextResponse.json({ success: true, notified: [] });
    }

    // If no userId (test mode), send to a hardcoded test path
    if (!userId && !_test) {
      return NextResponse.json({ success: true, notified: [] });
    }

    const webhookUrls: { slack_webhook_url: string | null; discord_webhook_url: string | null } = {
      slack_webhook_url: null,
      discord_webhook_url: null,
    };

    // For test mode, use the URLs from the request body directly (passed through settings page)
    if (_test) {
      // In test mode, we need to get the URLs from the user_settings. We'll read them
      // from the request body if provided, otherwise from the database.
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Not needed
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_settings")
          .select("slack_webhook_url, discord_webhook_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          webhookUrls.slack_webhook_url = data.slack_webhook_url;
          webhookUrls.discord_webhook_url = data.discord_webhook_url;
        }
      }

      // If we have no webhook URLs, we can't test
      if (!webhookUrls.slack_webhook_url && !webhookUrls.discord_webhook_url) {
        return NextResponse.json(
          { success: false, error: "No webhooks configured. Save a webhook URL first." },
          { status: 400 }
        );
      }
    } else if (userId) {
      // Fetch webhook URLs from user_settings table
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Not needed
            },
          },
        }
      );

      const { data } = await supabase
        .from("user_settings")
        .select("slack_webhook_url, discord_webhook_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        webhookUrls.slack_webhook_url = data.slack_webhook_url;
        webhookUrls.discord_webhook_url = data.discord_webhook_url;
      }
    }

    const notified: string[] = [];
    const isoTimestamp = new Date().toISOString();

    // Send Slack webhook
    if (webhookUrls.slack_webhook_url) {
      try {
        const slackPayload = {
          text: "🚨 *Centry Alert* — Threat Detected",
          attachments: [
            {
              color: "#ff4444",
              fields: [
                { title: "IP Address", value: ip, short: true },
                { title: "Abuse Score", value: `${abuseScore}/100`, short: true },
                { title: "Country", value: country, short: true },
                { title: "ISP", value: isp, short: true },
              ],
            },
          ],
        };

        const slackResponse = await fetch(webhookUrls.slack_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });

        if (slackResponse.ok) {
          notified.push("slack");
        }
      } catch (err) {
        console.error("Failed to send Slack notification:", err);
      }
    }

    // Send Discord webhook
    if (webhookUrls.discord_webhook_url) {
      try {
        const discordPayload = {
          embeds: [
            {
              title: "🚨 Centry Alert — Threat Detected",
              color: 16711748,
              fields: [
                { name: "IP Address", value: ip, inline: true },
                { name: "Abuse Score", value: `${abuseScore}/100`, inline: true },
                { name: "Country", value: country, inline: true },
                { name: "ISP", value: isp, inline: true },
              ],
              footer: { text: "Centry Threat Monitor" },
              timestamp: isoTimestamp,
            },
          ],
        };

        const discordResponse = await fetch(webhookUrls.discord_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload),
        });

        if (discordResponse.ok) {
          notified.push("discord");
        }
      } catch (err) {
        console.error("Failed to send Discord notification:", err);
      }
    }

    return NextResponse.json({ success: true, notified });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}