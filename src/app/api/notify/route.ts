import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendAlertNotification, sendTestNotification, type AlertPayload } from "@/lib/notify";

/**
 * POST /api/notify
 *
 * Two modes:
 *  1. Real alert  — body: AlertPayload (called server-side from scan routes)
 *  2. Test mode   — body: { _test: true, discord?: string, slack?: string }
 *     Sends a sample notification to the provided or saved URLs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Test mode ─────────────────────────────────────────────────────────────
    if (body._test === true) {
      // Build Supabase client from cookies to identify the calling user
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {},
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Caller may pass explicit URLs to test (before saving), or we fetch from DB
      let discordUrl: string | null = body.discordUrl ?? null;
      let slackUrl: string | null = body.slackUrl ?? null;

      if (!discordUrl && !slackUrl) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("discord_webhook_url, slack_webhook_url")
          .eq("user_id", user.id)
          .maybeSingle();

        discordUrl = settings?.discord_webhook_url ?? null;
        slackUrl = settings?.slack_webhook_url ?? null;
      }

      if (!discordUrl && !slackUrl) {
        return NextResponse.json(
          { success: false, error: "No webhook URLs configured. Save at least one URL first." },
          { status: 400 }
        );
      }

      const result = await sendTestNotification(discordUrl, slackUrl);
      return NextResponse.json({ success: true, result });
    }

    // ── Real alert mode ───────────────────────────────────────────────────────
    const {
      userId,
      severity,
      checkType,
      assetName,
      assetTarget,
      title,
      details,
      assetPath,
    } = body as AlertPayload & { userId: string };

    if (!userId || !severity || !checkType || !title || !assetTarget) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload: AlertPayload = {
      userId,
      severity,
      checkType,
      assetName: assetName ?? assetTarget,
      assetTarget,
      title,
      details: details ?? {},
      assetPath,
    };

    const result = await sendAlertNotification(payload);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Notify route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
