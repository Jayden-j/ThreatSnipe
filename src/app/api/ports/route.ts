import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { Socket } from "net";
import { lookup } from "dns/promises";

export const maxDuration = 30;

interface PortInfo {
  port: number;
  protocol: string;
  state: string;
  service: string;
}

interface PortScanResult {
  target: string;
  host: string;
  ports: PortInfo[];
  openCount: number;
  closedCount: number;
  filteredCount: number;
  scanDate: string;
}

interface CommonPort {
  port: number;
  service: string;
}

const HIGH_RISK_PORTS = [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 5432, 6379, 27017];

const COMMON_PORTS: CommonPort[] = [
  { port: 20, service: "ftp-data" },
  { port: 21, service: "ftp" },
  { port: 22, service: "ssh" },
  { port: 23, service: "telnet" },
  { port: 25, service: "smtp" },
  { port: 53, service: "dns" },
  { port: 80, service: "http" },
  { port: 110, service: "pop3" },
  { port: 111, service: "rpcbind" },
  { port: 135, service: "msrpc" },
  { port: 139, service: "netbios-ssn" },
  { port: 143, service: "imap" },
  { port: 443, service: "https" },
  { port: 445, service: "microsoft-ds" },
  { port: 993, service: "imaps" },
  { port: 995, service: "pop3s" },
  { port: 1433, service: "ms-sql-s" },
  { port: 1521, service: "oracle" },
  { port: 2049, service: "nfs" },
  { port: 3306, service: "mysql" },
  { port: 3389, service: "ms-wbt-server" },
  { port: 5432, service: "postgresql" },
  { port: 5900, service: "vnc" },
  { port: 5984, service: "couchdb" },
  { port: 6379, service: "redis" },
  { port: 8080, service: "http-proxy" },
  { port: 8443, service: "https-alt" },
  { port: 9000, service: "cslistener" },
  { port: 9090, service: "websm" },
  { port: 27017, service: "mongod" },
];

const SCAN_TIMEOUT = 1500; // 1.5 seconds per port
const CONCURRENCY = 10; // Scan 10 ports at a time

function isValidIPv4(input: string): boolean {
  const parts = input.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
  });
}

function isValidHostname(input: string): boolean {
  if (!input.includes(".")) return false;
  if (input.includes(" ")) return false;
  if (/[^a-zA-Z0-9.\-]/.test(input)) return false;
  if (input.startsWith(".") || input.endsWith(".")) return false;
  if (input.startsWith("-") || input.endsWith("-")) return false;
  return input.length > 0;
}

function isValidTarget(input: string): boolean {
  return isValidIPv4(input) || isValidHostname(input);
}

async function resolveHost(target: string): Promise<string> {
  if (isValidIPv4(target)) return target;
  try {
    const result = await lookup(target);
    return result.address;
  } catch {
    return target;
  }
}

function scanPort(host: string, port: number): Promise<PortInfo> {
  const commonPort = COMMON_PORTS.find((p) => p.port === port);
  const service = commonPort?.service ?? "unknown";

  return new Promise((resolve) => {
    const socket = new Socket();
    let settled = false;

    const finish = (state: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        port,
        protocol: "tcp",
        state,
        service,
      });
    };

    socket.setTimeout(SCAN_TIMEOUT);
    socket.on("connect", () => finish("open"));
    socket.on("timeout", () => finish("filtered"));
    socket.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNREFUSED") finish("closed");
      else finish("filtered");
    });
    socket.connect(port, host);
  });
}

async function scanPortsInBatches(
  host: string,
  ports: { port: number }[]
): Promise<PortInfo[]> {
  const results: PortInfo[] = [];

  for (let i = 0; i < ports.length; i += CONCURRENCY) {
    const batch = ports.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((p) => scanPort(host, p.port))
    );
    results.push(...batchResults);
  }

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");

  if (!target) {
    return NextResponse.json(
      { error: "Missing required parameter: target" },
      { status: 400 }
    );
  }

  const trimmedTarget = target.trim();

  if (!isValidTarget(trimmedTarget)) {
    return NextResponse.json(
      { error: "Invalid IP address or hostname" },
      { status: 400 }
    );
  }

  try {
    // Resolve hostname to IP for display
    const host = await resolveHost(trimmedTarget);

    // Scan common ports
    const ports = await scanPortsInBatches(host, COMMON_PORTS);

    const openPorts = ports.filter((p) => p.state === "open");
    const openCount = openPorts.length;
    const closedCount = ports.filter((p) => p.state === "closed").length;
    const filteredCount = ports.filter((p) => p.state === "filtered").length;

    const result: PortScanResult = {
      target: trimmedTarget,
      host,
      ports,
      openCount,
      closedCount,
      filteredCount,
      scanDate: new Date().toISOString(),
    };

    // Save scan to Supabase if user is authenticated
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Not needed in API route context
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: scanRecord } = await supabase
          .from("port_scans")
          .insert({
            user_id: user.id,
            target: trimmedTarget,
            host,
            open_count: openCount,
            closed_count: closedCount,
            filtered_count: filteredCount,
            ports,
          })
          .select("id")
          .single();

        // Evaluate alert: check high-risk ports and open count
        if (scanRecord?.id && (openCount > 0)) {
          const highRiskOpen = openPorts.filter((p) => HIGH_RISK_PORTS.includes(p.port));
          const highRiskNames = highRiskOpen.map((p) => `${p.service} (${p.port})`);

          let severity: string;
          let title: string;
          let message: string;

          if (highRiskOpen.length > 0) {
            severity = "critical";
            title = `Port Risk: ${trimmedTarget}`;
            message = `${openCount} open port${openCount === 1 ? "" : "s"} including high-risk: ${highRiskNames.join(", ")}`;
          } else if (openCount >= 5) {
            severity = "high";
            title = `Port Risk: ${trimmedTarget}`;
            message = `${openCount} open port${openCount === 1 ? "" : "s"} detected - above normal threshold`;
          } else {
            severity = "medium";
            title = `Port Risk: ${trimmedTarget}`;
            message = `${openCount} open port${openCount === 1 ? "" : "s"} detected`;
          }

          try {
            const serviceSupabase = createServiceClient();
            await serviceSupabase.from("alerts").insert({
              user_id: user.id,
              source_table: "port_scans",
              source_record_id: scanRecord.id,
              severity,
              category: "port_risk",
              title,
              message,
              metadata: {
                target: trimmedTarget,
                host,
                open_count: openCount,
                high_risk_ports: highRiskOpen.map((p) => ({
                  port: p.port,
                  service: p.service,
                })),
              },
            });
          } catch (alertError) {
            console.error("Failed to insert alert:", alertError);
          }
        }
      }
    } catch (dbError) {
      console.error("Failed to save port scan to database:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Port scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan target. Try again in a moment." },
      { status: 500 }
    );
  }
}