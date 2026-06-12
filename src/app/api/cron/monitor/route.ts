import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendAlertNotification, type AlertSeverity, type AlertCheckType } from "@/lib/notify";

// ─── Tool endpoint map ─────────────────────────────────────────────────────────

const TOOL_ENDPOINTS: Record<string, { path: string; param: string; method?: string }> = {
  ip_lookup:      { path: "/api/lookup",         param: "ip" },
  domain_lookup:  { path: "/api/domain",          param: "domain" },
  port_scan:      { path: "/api/ports",           param: "target" },
  blacklist:      { path: "/api/blacklist",        param: "",       method: "POST" },
  dns_records:    { path: "/api/dns",             param: "hostname" },
  whois:          { path: "/api/whois",            param: "hostname" },
  ssl:            { path: "/api/ssl",             param: "host" },
  email_security: { path: "/api/email-security",  param: "domain" },
  server_status:  { path: "/api/server-status",   param: "host" },
};

const HIGH_RISK_PORTS = [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 5432, 6379, 27017];

// ─── Status inference ─────────────────────────────────────────────────────────

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

// ─── Alert building ────────────────────────────────────────────────────────────

interface AlertData {
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

function getAlertFromResult(toolType: string, result: any, assetTarget: string): AlertData | null {
  if (result?.error) return null;
  switch (toolType) {
    case "ip_lookup": {
      const score: number = result?.abuseScore ?? 0;
      if (score < 15) return null;
      const severity: AlertSeverity =
        score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
      return {
        severity,
        title: `IP Threat Detected: ${assetTarget}`,
        message: `Abuse score ${score}/100 with ${result.totalReports ?? 0} report(s)`,
        metadata: { abuseScore: score, totalReports: result.totalReports, country: result.country, isp: result.isp },
      };
    }
    case "domain_lookup": {
      const verdict: string = result?.verdict ?? "CLEAN";
      if (verdict === "CLEAN") return null;
      const malicious: number = result?.malicious ?? 0;
      const suspicious: number = result?.suspicious ?? 0;
      const severity: AlertSeverity = malicious > 0 ? "critical" : suspicious > 3 ? "high" : "medium";
      return {
        severity,
        title: `Malicious Domain: ${assetTarget}`,
        message: `${malicious} malicious, ${suspicious} suspicious detections`,
        metadata: { malicious, suspicious, verdict, reputation: result.reputation },
      };
    }
    case "port_scan": {
      const ports: any[] = result?.ports ?? [];
      const openPorts = ports.filter((p: any) => p.state === "open");
      if (openPorts.length === 0) return null;
      const highRiskOpen = openPorts.filter((p: any) => HIGH_RISK_PORTS.includes(p.port));
      const severity: AlertSeverity =
        highRiskOpen.length > 0 ? "critical" : openPorts.length >= 5 ? "high" : "medium";
      const message =
        highRiskOpen.length > 0
          ? `${openPorts.length} open port(s) including high-risk: ${highRiskOpen.map((p: any) => p.service || p.port).join(", ")}`
          : `${openPorts.length} open port(s) detected`;
      return {
        severity,
        title: `Port Risk: ${assetTarget}`,
        message,
        metadata: { openCount: openPorts.length, highRiskPorts: highRiskOpen.map((p: any) => ({ port: p.port, service: p.service })) },
      };
    }
    case "blacklist": {
      const count: number = result?.listedCount ?? 0;
      if (count === 0) return null;
      const severity: AlertSeverity = count >= 5 ? "critical" : count >= 3 ? "high" : "medium";
      return {
        severity,
        title: `Blacklist Hit: ${assetTarget}`,
        message: `Listed on ${count} blacklist${count === 1 ? "" : "s"}`,
        metadata: { listedCount: count },
      };
    }
    case "ssl": {
      if (!result?.isExpired && !result?.isExpiringSoon) return null;
      const severity: AlertSeverity = result.isExpired ? "critical" : "high";
      return {
        severity,
        title: `SSL Issue: ${assetTarget}`,
        message: result.isExpired
          ? `SSL certificate expired on ${result.validTo ?? "unknown date"}`
          : `SSL certificate expires in ${result.daysUntilExpiry ?? "?"} day(s)`,
        metadata: { isExpired: result.isExpired, validTo: result.validTo, daysUntilExpiry: result.daysUntilExpiry },
      };
    }
    case "server_status": {
      const status: string = result?.overallStatus ?? "";
      if (status !== "offline" && status !== "degraded") return null;
      return {
        severity: status === "offline" ? "critical" : "high",
        title: `Server ${status === "offline" ? "Down" : "Degraded"}: ${assetTarget}`,
        message: status === "offline"
          ? "Server is not responding to any checks"
          : "Server performance is degraded",
        metadata: { overallStatus: status },
      };
    }
    default:
      return null;
  }
}

// ─── POST /api/cron/monitor ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Fetch all monitoring-enabled, non-CIDR assets
  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .select("*")
    .eq("monitoring_enabled", true)
    .neq("type", "cidr");

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  if (!assets?.length) {
    return NextResponse.json({ checked: 0, skipped: 0 });
  }

  // Filter to assets whose check_interval has elapsed since last_checked_at
  const now = Date.now();
  const dueAssets = assets.filter((asset) => {
    if (!asset.last_checked_at) return true;
    const intervalMs = (asset.check_interval as number) * 60 * 1000;
    return now - new Date(asset.last_checked_at as string).getTime() >= intervalMs;
  });

  if (!dueAssets.length) {
    return NextResponse.json({ checked: 0, skipped: assets.length });
  }

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  for (const asset of dueAssets) {
    const enabledTools = Object.entries(asset.checks_enabled as Record<string, boolean>)
      .filter(([, on]) => on)
      .map(([key]) => key)
      .filter((key) => key in TOOL_ENDPOINTS);

    const runStatuses: string[] = [];

    for (const tool of enabledTools) {
      const endpoint = TOOL_ENDPOINTS[tool];

      let toolResponse: Response;
      try {
        if (endpoint.method === "POST") {
          const blacklistType = asset.type === "ip" ? "ip" : "domain";
          toolResponse = await fetch(`${baseUrl}${endpoint.path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: blacklistType, target: asset.target }),
          });
        } else {
          const qs = new URLSearchParams({ [endpoint.param]: asset.target as string }).toString();
          toolResponse = await fetch(`${baseUrl}${endpoint.path}?${qs}`);
        }
      } catch {
        continue;
      }

      let result: any;
      let status: string;

      if (!toolResponse.ok) {
        result = { error: "Tool check failed" };
        status = "error";
      } else {
        result = await toolResponse.json();
        status = inferStatus(tool, result);
      }

      runStatuses.push(status);

      await supabase.from("asset_results").insert({
        asset_id: asset.id,
        user_id: asset.user_id,
        tool_type: tool,
        result,
        status,
      });

      // Alert handling (same dedup logic as manual check route)
      if (asset.alerts_enabled) {
        const alertData = getAlertFromResult(tool, result, asset.target as string);
        if (alertData) {
          const allowed: string[] = (asset.alert_severities as string[]) ?? ["critical", "high", "medium", "low"];
          if (allowed.includes(alertData.severity)) {
            const cutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
            const { count } = await supabase
              .from("alerts")
              .select("id", { count: "exact", head: true })
              .eq("asset_id", asset.id)
              .eq("check_type", tool)
              .eq("read", false)
              .gte("created_at", cutoff);

            if (!count) {
              await supabase.from("alerts").insert({
                user_id: asset.user_id,
                asset_id: asset.id,
                asset_name: asset.name,
                asset_target: asset.target,
                check_type: tool,
                severity: alertData.severity,
                title: alertData.title,
                message: alertData.message,
                metadata: alertData.metadata,
                read: false,
              });

              sendAlertNotification({
                userId: asset.user_id as string,
                severity: alertData.severity,
                checkType: tool as AlertCheckType,
                assetName: asset.name as string,
                assetTarget: asset.target as string,
                title: alertData.title,
                details: Object.fromEntries(
                  Object.entries(alertData.metadata).map(([k, v]) => [k, String(v)])
                ),
                assetPath: `/assets/${asset.id}`,
              }).catch(() => {});
            }
          }
        }
      }
    }

    // Compute overall status from this run and update the asset
    let lastStatus: "clean" | "suspicious" | "threat" | "unknown" = "clean";
    if (runStatuses.some((s) => s === "threat")) lastStatus = "threat";
    else if (runStatuses.some((s) => s === "suspicious")) lastStatus = "suspicious";
    else if (!runStatuses.length) lastStatus = "unknown";

    const checksPassed = runStatuses.filter((s) => s === "clean").length;

    await supabase
      .from("assets")
      .update({
        last_checked_at: new Date().toISOString(),
        last_status: lastStatus,
        checks_passed: checksPassed,
        checks_total: runStatuses.length,
      })
      .eq("id", asset.id);
  }

  return NextResponse.json({ checked: dueAssets.length, skipped: assets.length - dueAssets.length });
}
