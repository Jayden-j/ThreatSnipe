import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: assetError?.message || "Asset not found" },
        { status: 404 }
      );
    }

    // Fetch latest result per tool
    const { data: results, error: resultsError } = await supabase
      .from("asset_results")
      .select("*")
      .eq("asset_id", id)
      .eq("user_id", user.id)
      .order("checked_at", { ascending: false });

    if (resultsError) {
      return NextResponse.json({ error: resultsError.message }, { status: 500 });
    }

    // Deduplicate to latest result per tool_type
    const latestResults: Record<string, any> = {};
    for (const r of results || []) {
      if (!latestResults[r.tool_type]) {
        latestResults[r.tool_type] = r;
      }
    }

    return NextResponse.json({ asset, results: latestResults });
  } catch (error) {
    console.error("Asset GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "name", "target", "type", "checks_enabled",
      "monitoring_enabled", "check_interval", "alerts_enabled",
      "alert_severities", "alert_channels"
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Asset PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Asset DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}