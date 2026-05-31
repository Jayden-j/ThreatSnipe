import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Map of tool types to their API endpoints and target param names ───

const TOOL_ENDPOINTS: Record<string, { path: string; param: string }> = {
  ip_lookup: { path: "/api/lookup", param: "ip" },
  domain_lookup: { path: "/api/domain", param: "domain" },
  port_scan: { path: "/api/ports", param: "target" },
  blacklist: { path: "/api/blacklist", param: "hostname" },
  dns_records: { path: "/api/dns", param: "domain" },
  whois: { path: "/api/whois", param: "domain" },
  ssl: { path: "/api/ssl", param: "host" },
  email_security: { path: "/api/email-security", param: "domain" },
  server_status: { path: "/api/server-status", param: "host" },
};

// ─── Determine status from tool result ───

function inferStatus(toolType: string, result: any): string {
  // Try to infer a status from the data
  if (result?.error) return "error";

  switch (toolType) {
    case "ip_lookup": {
      const score = result?.abuseScore ?? 0;
      if (score > 50) return "threat";
      if (score > 15) return "suspicious";
      return "clean";
    }
    case "blacklist": {
      const count = result?.listedCount ?? 0;
      if (count >= 5) return "threat";
      if (count >= 1) return "suspicious";
      return "clean";
    }
    case "ssl": {
      if (result?.isExpired) return "threat";
      if (result?.isExpiringSoon) return "suspicious";
      return "clean";
    }
    case "port_scan": {
      // Port scan - check if any unexpected ports open
      return "clean";
    }
    case "dns_records":
    case "whois":
    case "domain_lookup":
      return "clean";
    case "email_security": {
      // Check SPF/DKIM/DMARC issues
      return "clean";
    }
    case "server_status": {
      const status = result?.overallStatus;
      if (status === "offline") return "threat";
      if (status === "degraded") return "suspicious";
      return "clean";
    }
    default:
      return "clean";
  }
}

// ─── Determine target parameter from asset type ───

function getTargetParam(target: string, type: string, toolType: string): Record<string, string> {
  // For IP-based tools, use the target as-is
  // For domain-based tools, use the target as-is
  const endpoint = TOOL_ENDPOINTS[toolType];
  if (!endpoint) return {};
  return { [endpoint.param]: target };
}

// ─── POST handler ───

export async function POST(
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

    // Get the asset
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

    const body = await request.json();
    const { tool } = body;

    if (!tool) {
      return NextResponse.json(
        { error: "Missing required field: tool" },
        { status: 400 }
      );
    }

    const endpoint = TOOL_ENDPOINTS[tool];
    if (!endpoint) {
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    // Determine the base URL
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Build query params
    const targetParams = getTargetParam(asset.target, asset.type, tool);
    const queryString = new URLSearchParams(targetParams).toString();
    const url = `${baseUrl}${endpoint.path}?${queryString}`;

    // Call the tool API
    const toolResponse = await fetch(url, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    let result: any;
    let status: string;

    if (!toolResponse.ok) {
      const errorData = await toolResponse.json().catch(() => ({ error: "Tool check failed" }));
      result = { error: errorData.error || "Tool check failed" };
      status = "error";
    } else {
      result = await toolResponse.json();
      status = inferStatus(tool, result);
    }

    // Save to asset_results
    const { data: savedResult, error: saveError } = await supabase
      .from("asset_results")
      .insert({
        asset_id: id,
        user_id: user.id,
        tool_type: tool,
        result,
        status,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save asset result:", saveError);
    }

    // Update asset's last_checked_at
    await supabase
      .from("assets")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({
      tool,
      status,
      result,
      saved: !!savedResult,
    });
  } catch (error) {
    console.error("Asset check POST error:", error);
    return NextResponse.json(
      { error: "Failed to run check" },
      { status: 500 }
    );
  }
}