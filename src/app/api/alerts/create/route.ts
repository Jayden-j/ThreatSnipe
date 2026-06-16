import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAlertFromResult } from "@/lib/alert-rules";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tool_type, target, result } = body;

    if (!tool_type || !target || !result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const alertData = getAlertFromResult(tool_type, result, target);
    if (!alertData) {
      return NextResponse.json({ created: false });
    }

    const serviceSupabase = createServiceClient();

    // Deduplicate: skip if unread alert for same user+check_type+target in last hour
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await serviceSupabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("check_type", tool_type)
      .eq("asset_target", target)
      .eq("read", false)
      .gte("created_at", cutoff);

    if (count && count > 0) {
      return NextResponse.json({ created: false, reason: "deduplicated" });
    }

    await serviceSupabase.from("alerts").insert({
      user_id: user.id,
      asset_id: null,
      asset_name: target,
      asset_target: target,
      check_type: tool_type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      metadata: alertData.metadata,
      read: false,
    });

    return NextResponse.json({ created: true });
  } catch (err) {
    console.error("Alert create error:", err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
