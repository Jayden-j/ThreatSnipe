import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendAlertNotification, type AlertCheckType } from "@/lib/notify";
import { getAlertFromResult } from "@/lib/alert-rules";

// ─── Tool endpoint map ────────────────────────────────────────────────────────

const TOOL_ENDPOINTS: Record<string, { path: string; param: string; method?: string }> = {
  ip_lookup: { path: "/api/lookup", param: "ip" },
  domain_lookup: { path: "/api/domain", param: "domain" },
  port_scan: { path: "/api/ports", param: "target" },
  blacklist: { path: "/api/blacklist", param: "", method: "POST" },
  dns_records: { path: "/api/dns", param: "hostname" },
  whois: { path: "/api/whois", param: "hostname" },
  ssl: { path: "/api/ssl", param: "host" },
  email_security: { path: "/api/email-security", param: "domain" },
  server_status: { path: "/api/server-status", param: "host" },
};

const HIGH_RISK_PORTS = [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 5432, 6379, 27017];

// ─── Infer asset result status ────────────────────────────────────────────────

function inferStatus(toolType: string, result: any): string {
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
    case "server_status": {
      const status = result?.overallStatus;
      if (status === "offline") return "threat";
      if (status === "degraded") return "suspicious";
      return "clean";
    }
    case "domain_lookup": {
      const verdict = result?.verdict;
      if (verdict === "MALICIOUS") return "threat";
      if (verdict === "SUSPICIOUS") return "suspicious";
      return "clean";
    }
    case "port_scan": {
      const openPorts: any[] = result?.ports?.filter((p: any) => p.state === "open") ?? [];
      const hasHighRisk = openPorts.some((p: any) => HIGH_RISK_PORTS.includes(p.port));
      if (hasHighRisk) return "threat";
      if (openPorts.length >= 5) return "suspicious";
      return "clean";
    }
    default:
      return "clean";
  }
}

// ─── Target param resolver ────────────────────────────────────────────────────

function getTargetParam(target: string, toolType: string): Record<string, string> {
  const endpoint = TOOL_ENDPOINTS[toolType];
  if (!endpoint) return {};
  return { [endpoint.param]: target };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { tool, target: customTarget } = body;

    if (!tool) {
      return NextResponse.json({ error: "Missing required field: tool" }, { status: 400 });
    }

    const endpoint = TOOL_ENDPOINTS[tool];
    if (!endpoint) {
      return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    const effectiveTarget = customTarget || asset.target;
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Call the tool API
    let toolResponse: Response;
    if (endpoint.method === "POST") {
      const blacklistType = asset.type === "ip" ? "ip" : "domain";
      toolResponse = await fetch(`${baseUrl}${endpoint.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ type: blacklistType, target: effectiveTarget }),
      });
    } else {
      const queryString = new URLSearchParams(getTargetParam(effectiveTarget, tool)).toString();
      toolResponse = await fetch(`${baseUrl}${endpoint.path}?${queryString}`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });
    }

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
    const resultWithTarget = customTarget ? { ...result, target: customTarget } : result;
    const { data: savedResult, error: saveError } = await supabase
      .from("asset_results")
      .insert({
        asset_id: id,
        user_id: user.id,
        tool_type: tool,
        result: resultWithTarget,
        status,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save asset result:", saveError);
    }

    // Recompute overall asset status from all latest results
    const { data: allResults } = await supabase
      .from("asset_results")
      .select("tool_type, status, checked_at")
      .eq("asset_id", id)
      .eq("user_id", user.id)
      .order("checked_at", { ascending: false });

    const latestByTool: Record<string, string> = {};
    for (const r of allResults ?? []) {
      if (!latestByTool[r.tool_type]) latestByTool[r.tool_type] = r.status;
    }
    const statuses = Object.values(latestByTool);
    let overallStatus: "clean" | "suspicious" | "threat" | "unknown" = "clean";
    if (statuses.length === 0) overallStatus = "unknown";
    else if (statuses.some((s) => s === "threat")) overallStatus = "threat";
    else if (statuses.some((s) => s === "suspicious")) overallStatus = "suspicious";

    const checksTotal = statuses.length;
    const checksPassed = statuses.filter((s) => s === "clean").length;

    await supabase
      .from("assets")
      .update({
        last_checked_at: new Date().toISOString(),
        last_status: overallStatus,
        checks_total: checksTotal,
        checks_passed: checksPassed,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    // ── Alert creation ────────────────────────────────────────────────────────
    if (asset.alerts_enabled) {
      const alertData = getAlertFromResult(tool, result, effectiveTarget);

      if (alertData) {
        const alertSeverities: string[] = asset.alert_severities ?? [
          "critical",
          "high",
          "medium",
          "low",
        ];

        if (alertSeverities.includes(alertData.severity)) {
          try {
            const serviceSupabase = createServiceClient();

            // Deduplicate: skip if an unread alert for this asset+check_type already exists
            // within the last 24 hours to avoid spamming on periodic scans
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count } = await serviceSupabase
              .from("alerts")
              .select("id", { count: "exact", head: true })
              .eq("asset_id", id)
              .eq("check_type", tool)
              .eq("read", false)
              .gte("created_at", cutoff);

            if (!count || count === 0) {
              await serviceSupabase.from("alerts").insert({
                user_id: user.id,
                asset_id: id,
                asset_name: asset.name,
                asset_target: effectiveTarget,
                check_type: tool,
                severity: alertData.severity,
                title: alertData.title,
                message: alertData.message,
                metadata: alertData.metadata,
                read: false,
              });

              // Fire Discord/Slack notification (non-blocking)
              sendAlertNotification({
                userId: user.id,
                severity: alertData.severity,
                checkType: tool as AlertCheckType,
                assetName: asset.name,
                assetTarget: effectiveTarget,
                title: alertData.title,
                details: Object.fromEntries(
                  Object.entries(alertData.metadata).map(([k, v]) => [k, String(v)])
                ),
                assetPath: `/assets/${id}`,
              }).catch((err) => console.error("Alert notify error:", err));
            }
          } catch (alertErr) {
            console.error("Failed to create alert:", alertErr);
          }
        }
      }
    }

    return NextResponse.json({
      tool,
      status,
      result,
      saved: !!savedResult,
    });
  } catch (error) {
    console.error("Asset check POST error:", error);
    return NextResponse.json({ error: "Failed to run check" }, { status: 500 });
  }
}
