export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface AlertData {
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

const HIGH_RISK_PORTS = [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 5432, 6379, 27017];

export function getAlertFromResult(
  toolType: string,
  result: any,
  assetTarget: string
): AlertData | null {
  if (!result || result.error) return null;

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
        metadata: {
          abuseScore: score,
          totalReports: result.totalReports,
          country: result.country,
          isp: result.isp,
        },
      };
    }

    case "domain_lookup": {
      const verdict: string = result?.verdict ?? "CLEAN";
      if (verdict === "CLEAN") return null;
      const malicious: number = result?.malicious ?? 0;
      const suspicious: number = result?.suspicious ?? 0;
      const severity: AlertSeverity =
        malicious > 0 ? "critical" : suspicious > 3 ? "high" : "medium";
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
      const highRiskNames = highRiskOpen.map((p: any) => `${p.service || p.port}`);
      const message =
        highRiskOpen.length > 0
          ? `${openPorts.length} open port(s) including high-risk: ${highRiskNames.join(", ")}`
          : `${openPorts.length} open port(s) detected`;
      return {
        severity,
        title: `Port Risk: ${assetTarget}`,
        message,
        metadata: {
          openCount: openPorts.length,
          highRiskPorts: highRiskOpen.map((p: any) => ({ port: p.port, service: p.service })),
        },
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
      const message = result.isExpired
        ? `SSL certificate expired on ${result.validTo ?? "unknown date"}`
        : `SSL certificate expires in ${result.daysUntilExpiry ?? "?"} day(s)`;
      return {
        severity,
        title: `SSL Issue: ${assetTarget}`,
        message,
        metadata: {
          isExpired: result.isExpired,
          validTo: result.validTo,
          daysUntilExpiry: result.daysUntilExpiry,
        },
      };
    }

    case "server_status": {
      const status: string = result?.overallStatus ?? "";
      if (status !== "offline" && status !== "degraded") return null;
      const severity: AlertSeverity = status === "offline" ? "critical" : "high";
      return {
        severity,
        title: `Server ${status === "offline" ? "Down" : "Degraded"}: ${assetTarget}`,
        message:
          status === "offline"
            ? "Server is not responding to any checks"
            : "Server performance is degraded",
        metadata: { overallStatus: status },
      };
    }

    default:
      return null;
  }
}
