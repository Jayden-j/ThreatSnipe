import { NextRequest, NextResponse } from "next/server";
import * as dns from "dns/promises";
import * as net from "net";

interface PortResult {
  open: boolean;
  latencyMs: number | null;
}

interface HttpResult {
  statusCode: number | null;
  responseTimeMs: number | null;
  redirectUrl: string | null;
  error: string | null;
}

interface ServerStatusResult {
  host: string;
  resolvedIp: string | null;
  dnsStatus: "resolved" | "failed";
  ports: {
    80: PortResult;
    443: PortResult;
  };
  http: HttpResult;
  overallStatus: "up" | "degraded" | "down";
}

function checkPort(host: string, port: number, timeout = 5000): Promise<PortResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ open: true, latencyMs });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({ open: false, latencyMs: null });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ open: false, latencyMs: null });
    });

    socket.connect(port, host);
  });
}

async function checkHttp(host: string): Promise<HttpResult> {
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://${host}`, {
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - start;

    let redirectUrl: string | null = null;
    if (
      response.status >= 301 &&
      response.status <= 308 &&
      response.headers.has("location")
    ) {
      redirectUrl = response.headers.get("location");
    }

    return {
      statusCode: response.status,
      responseTimeMs,
      redirectUrl,
      error: null,
    };
  } catch (error) {
    // Try HTTP if HTTPS fails
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`http://${host}`, {
        signal: controller.signal,
        redirect: "manual",
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - start;

      let redirectUrl: string | null = null;
      if (
        response.status >= 301 &&
        response.status <= 308 &&
        response.headers.has("location")
      ) {
        redirectUrl = response.headers.get("location");
      }

      return {
        statusCode: response.status,
        responseTimeMs,
        redirectUrl,
        error: null,
      };
    } catch (httpError) {
      return {
        statusCode: null,
        responseTimeMs: null,
        redirectUrl: null,
        error:
          httpError instanceof Error ? httpError.message : "HTTP check failed",
      };
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host");

  if (!host) {
    return NextResponse.json(
      { error: "Missing required parameter: host" },
      { status: 400 }
    );
  }

  try {
    // Run all checks in parallel
    const [dnsResult, port80, port443, httpResult] = await Promise.all([
      dns.resolve4(host).then(
        (addresses) => ({ ip: addresses[0] || null, status: "resolved" as const }),
        () => ({ ip: null, status: "failed" as const })
      ),
      checkPort(host, 80),
      checkPort(host, 443),
      checkHttp(host),
    ]);

    // Determine overall status
    let overallStatus: "up" | "degraded" | "down";

    const isDnsOk = dnsResult.status === "resolved";
    const isAnyPortOpen = port80.open || port443.open;
    const isHttpOk =
      httpResult.statusCode !== null &&
      httpResult.statusCode >= 200 &&
      httpResult.statusCode < 400;
    const isHttpDegraded =
      httpResult.statusCode !== null ||
      (httpResult.responseTimeMs !== null && httpResult.responseTimeMs > 2000);

    if (isDnsOk && isAnyPortOpen && isHttpOk) {
      overallStatus = "up";
    } else if (isDnsOk && (isAnyPortOpen || isHttpDegraded)) {
      overallStatus = "degraded";
    } else {
      overallStatus = "down";
    }

    const result: ServerStatusResult = {
      host,
      resolvedIp: dnsResult.ip,
      dnsStatus: dnsResult.status,
      ports: {
        80: port80,
        443: port443,
      },
      http: httpResult,
      overallStatus,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Server status check error:", error);
    return NextResponse.json(
      { error: "Failed to check server status" },
      { status: 500 }
    );
  }
}