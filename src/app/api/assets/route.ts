import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Assets GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, target, type, checks_enabled, monitoring_enabled, check_interval, alerts_enabled, alert_severities, alert_channels } = body;

    if (!name || !target || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, target, type" },
        { status: 400 }
      );
    }

    if (!["ip", "domain", "hostname"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be ip, domain, or hostname" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        name,
        target,
        type,
        checks_enabled: checks_enabled || undefined,
        monitoring_enabled: monitoring_enabled || false,
        check_interval: check_interval || "default",
        alerts_enabled: alerts_enabled || false,
        alert_severities: alert_severities || ["critical", "high"],
        alert_channels: alert_channels || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Assets POST error:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}