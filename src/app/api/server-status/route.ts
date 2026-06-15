import { NextRequest, NextResponse } from "next/server";
import * as dns from "dns/promises";
import * as net from "net";
import { checkSSLCertificate } from "@/lib/ssl";
import { authenticate } from "@/lib/api-auth";
import { ratelimit } from "@/lib/ratelimit";

function isBlockedHost(host: string): boolean {
  if (/^localhost$/i.test(host)) return true;
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(host) || host === "::1";
}

function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !isBlockedHost(parsed.hostname);
  } catch {
    return false;
  }
}

interface PortResult {
  open: boolean;
  latencyMs: number | null;
}

interface RedirectStep {
  url: string;
  statusCode: number;
}

interface HttpResult {
  statusCode: number | null;
  responseTimeMs: number | null;
  redirectChain: RedirectStep[];
  headers: Record<string, string>;
  contentType: string | null;
  error: string | null;
}

interface LatencySample {
  label: string;
  ms: number;
}

interface LatencyStats {
  min: number;
  max: number;
  avg: number;
}

interface ServerStatusResult {
  host: string;
  resolvedIp: string | null;
  resolvedIpv6: string | null;
  dnsLatencyMs: number | null;
  dnsStatus: "resolved" | "failed";
  ports: {
    80: PortResult;
    443: PortResult;
    22: PortResult;
    21: PortResult;
  };
  http: HttpResult;
  ssl: {
    valid: boolean;
    daysUntilExpiry: number | null;
    issuer: string | null;
    isExpiringSoon: boolean;
    error: string | null;
  };
  latencySamples: LatencySample[];
  latencyStats: LatencyStats;
  overallStatus: "online" | "degraded" | "offline";
  degradedReasons: string[];
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

      // Build redirect chain
      const redirectChain: RedirectStep[] = [];
      let finalContentType: string | null = response.headers.get("content-type") || null;

      // Detect initial redirect
      if (
        response.status >= 301 &&
        response.status <= 308 &&
        response.headers.has("location")
      ) {
        redirectChain.push({
          url: `https://${host}`,
          statusCode: response.status,
        });
        const location = response.headers.get("location") || "";
        // Follow redirect to get the next hop
        try {
          if (!isSafeRedirectUrl(location)) throw new Error("Redirect blocked");
          const followStart = Date.now();
          const followController = new AbortController();
          const followTimeout = setTimeout(() => followController.abort(), 5000);
          const followResponse = await fetch(location, {
            signal: followController.signal,
            redirect: "manual",
          });
          clearTimeout(followTimeout);
          redirectChain.push({
            url: location,
            statusCode: followResponse.status,
          });
          // Get content-type from final response (follow one more if needed)
          if (followResponse.status >= 301 && followResponse.status <= 308 && followResponse.headers.has("location")) {
            // Follow one more hop
            const location2 = followResponse.headers.get("location") || "";
            try {
              if (!isSafeRedirectUrl(location2)) throw new Error("Redirect blocked");
              const followController2 = new AbortController();
              const followTimeout2 = setTimeout(() => followController2.abort(), 5000);
              const followResponse2 = await fetch(location2, {
                signal: followController2.signal,
                redirect: "manual",
              });
              clearTimeout(followTimeout2);
              redirectChain.push({
                url: location2,
                statusCode: followResponse2.status,
              });
              finalContentType = followResponse2.headers.get("content-type") || null;
            } catch {
              finalContentType = followResponse.headers.get("content-type") || null;
            }
          } else {
            finalContentType = followResponse.headers.get("content-type") || null;
          }
        } catch {
          redirectChain.push({
            url: location,
            statusCode: 0,
          });
        }
      }

      // Collect key security headers (from the original response — these are the ones we want)
      const headerKeys = [
        "server",
        "x-powered-by",
        "strict-transport-security",
        "content-security-policy",
        "x-frame-options",
      ];
      const headers: Record<string, string> = {};
      for (const key of headerKeys) {
        const val = response.headers.get(key);
        if (val) headers[key] = val;
      }

      return {
        statusCode: response.status,
        responseTimeMs,
        redirectChain,
        headers,
        contentType: finalContentType,
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

        const redirectChain: RedirectStep[] = [];
        let finalContentType: string | null = response.headers.get("content-type") || null;

        if (
          response.status >= 301 &&
          response.status <= 308 &&
          response.headers.has("location")
        ) {
          redirectChain.push({
            url: `http://${host}`,
            statusCode: response.status,
          });
          const location = response.headers.get("location") || "";
          try {
            if (!isSafeRedirectUrl(location)) throw new Error("Redirect blocked");
            const followStart = Date.now();
            const followController = new AbortController();
            const followTimeout = setTimeout(() => followController.abort(), 5000);
            const followResponse = await fetch(location, {
              signal: followController.signal,
              redirect: "manual",
            });
            clearTimeout(followTimeout);
            redirectChain.push({
              url: location,
              statusCode: followResponse.status,
            });
            if (followResponse.status >= 301 && followResponse.status <= 308 && followResponse.headers.has("location")) {
              const location2 = followResponse.headers.get("location") || "";
              try {
                if (!isSafeRedirectUrl(location2)) throw new Error("Redirect blocked");
                const followController2 = new AbortController();
                const followTimeout2 = setTimeout(() => followController2.abort(), 5000);
                const followResponse2 = await fetch(location2, {
                  signal: followController2.signal,
                  redirect: "manual",
                });
                clearTimeout(followTimeout2);
                redirectChain.push({
                  url: location2,
                  statusCode: followResponse2.status,
                });
                finalContentType = followResponse2.headers.get("content-type") || null;
              } catch {
                finalContentType = followResponse.headers.get("content-type") || null;
              }
            } else {
              finalContentType = followResponse.headers.get("content-type") || null;
            }
          } catch {
            redirectChain.push({
              url: location,
              statusCode: 0,
            });
          }
        }

        const headerKeys = [
          "server",
          "x-powered-by",
          "strict-transport-security",
          "content-security-policy",
          "x-frame-options",
        ];
        const headers: Record<string, string> = {};
        for (const key of headerKeys) {
          const val = response.headers.get(key);
          if (val) headers[key] = val;
        }

        return {
          statusCode: response.status,
          responseTimeMs,
          redirectChain,
          headers,
          contentType: finalContentType,
          error: null,
        };
    } catch (httpError) {
      return {
        statusCode: null,
        responseTimeMs: null,
        redirectChain: [],
        headers: {},
        contentType: null,
        error:
          httpError instanceof Error ? httpError.message : "HTTP check failed",
      };
    }
  }
}

async function runLatencySamples(host: string): Promise<{ samples: LatencySample[]; stats: LatencyStats }> {
  const ms: number[] = [];

  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      await fetch(`https://${host}`, {
        signal: controller.signal,
        method: "HEAD",
      });
      clearTimeout(timeoutId);
      ms.push(Date.now() - start);
    } catch {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        await fetch(`http://${host}`, {
          signal: controller.signal,
          method: "HEAD",
        });
        clearTimeout(timeoutId);
        ms.push(Date.now() - start);
      } catch {
        ms.push(0);
      }
    }
  }

  const samples: LatencySample[] = ms.map((m, i) => ({
    label: `Sample ${i + 1}`,
    ms: m,
  }));

  const validMs = ms.filter((m) => m > 0);
  const stats: LatencyStats = {
    min: validMs.length > 0 ? Math.min(...validMs) : 0,
    max: validMs.length > 0 ? Math.max(...validMs) : 0,
    avg: validMs.length > 0
      ? Math.round(validMs.reduce((a, b) => a + b, 0) / validMs.length)
      : 0,
  };

  return { samples, stats };
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.userId) {
    const { success } = await ratelimit.limit(auth.userId);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host");

  if (!host) {
    return NextResponse.json(
      { error: "Missing required parameter: host" },
      { status: 400 }
    );
  }

  if (isBlockedHost(host)) {
    return NextResponse.json({ error: "Private and reserved IP ranges are not allowed" }, { status: 400 });
  }

  const results = await Promise.allSettled([
    // 1. DNS Resolution (IPv4 and IPv6)
    (async () => {
      const dnsStart = Date.now();
      let ipv4: string | null = null;
      let ipv6: string | null = null;
      let resolved = false;

      try {
        const v4 = await dns.resolve4(host);
        if (v4.length > 0) {
          ipv4 = v4[0];
          resolved = true;
        }
      } catch {
        // IPv4 not available
      }

      try {
        const v6 = await dns.resolve6(host);
        if (v6.length > 0) {
          ipv6 = v6[0];
          resolved = true;
        }
      } catch {
        // IPv6 not available
      }

      const dnsLatencyMs = Date.now() - dnsStart;
      return {
        resolvedIp: ipv4,
        resolvedIpv6: ipv6,
        dnsLatencyMs,
        dnsStatus: (resolved ? "resolved" : "failed") as "resolved" | "failed",
      };
    })(),

    // 2. Port checks
    (async () => ({
      port80: await checkPort(host, 80),
      port443: await checkPort(host, 443),
      port22: await checkPort(host, 22),
      port21: await checkPort(host, 21),
    }))(),

    // 3. HTTP/HTTPS response
    checkHttp(host),

    // 4. SSL Certificate
    checkSSLCertificate(host),

    // 5. Multi-region latency simulation
    runLatencySamples(host),
  ]);

  // Extract DNS result
  let resolvedIp: string | null = null;
  let resolvedIpv6: string | null = null;
  let dnsLatencyMs: number | null = null;
  let dnsStatus: "resolved" | "failed" = "failed";

  if (results[0].status === "fulfilled") {
    resolvedIp = results[0].value.resolvedIp;
    resolvedIpv6 = results[0].value.resolvedIpv6;
    dnsLatencyMs = results[0].value.dnsLatencyMs;
    dnsStatus = results[0].value.dnsStatus;
  }

  // Extract ports
  let port80: PortResult = { open: false, latencyMs: null };
  let port443: PortResult = { open: false, latencyMs: null };
  let port22: PortResult = { open: false, latencyMs: null };
  let port21: PortResult = { open: false, latencyMs: null };

  if (results[1].status === "fulfilled") {
    port80 = results[1].value.port80;
    port443 = results[1].value.port443;
    port22 = results[1].value.port22;
    port21 = results[1].value.port21;
  }

  // Extract HTTP
  let http: HttpResult = {
    statusCode: null,
    responseTimeMs: null,
    redirectChain: [],
    headers: {},
    contentType: null,
    error: "HTTP check failed",
  };

  if (results[2].status === "fulfilled") {
    http = results[2].value;
  }

  // Extract SSL
  let ssl = {
    valid: false,
    daysUntilExpiry: null as number | null,
    issuer: null as string | null,
    isExpiringSoon: false,
    error: "SSL check failed" as string | null,
  };

  if (results[3].status === "fulfilled") {
    ssl = results[3].value;
  }

  // Extract latency
  let latencySamples: LatencySample[] = [];
  let latencyStats: LatencyStats = { min: 0, max: 0, avg: 0 };

  if (results[4].status === "fulfilled") {
    latencySamples = results[4].value.samples;
    latencyStats = results[4].value.stats;
  }

  // Determine overallStatus and degradedReasons
  const degradedReasons: string[] = [];

  const isDnsOk = dnsStatus === "resolved";
  const isPort443Open = port443.open;
  const isHttpOk =
    http.statusCode !== null &&
    http.statusCode >= 200 &&
    http.statusCode < 400;
  const isHttpRedirect =
    http.statusCode !== null &&
    http.statusCode >= 300 &&
    http.statusCode < 400;
  const isHttpError =
    http.statusCode !== null &&
    (http.statusCode >= 400 || http.statusCode === 0);
  const isSslValid = ssl.valid;
  const isSslExpiringSoon = ssl.isExpiringSoon;

  // Build degraded reasons
  if (!isDnsOk) {
    degradedReasons.push("DNS resolution failed");
  }
  if (!isPort443Open) {
    degradedReasons.push("Port 443 is closed");
  }
  if (http.statusCode !== null && http.statusCode >= 400) {
    degradedReasons.push(`HTTP ${http.statusCode}`);
  }
  if (http.responseTimeMs !== null && http.responseTimeMs > 2000) {
    degradedReasons.push(`Response time ${http.responseTimeMs}ms exceeds 2000ms`);
  }
  if (ssl.error && !ssl.error.includes("Connection timed out")) {
    degradedReasons.push(`SSL: ${ssl.error}`);
  }
  if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry <= 30 && ssl.daysUntilExpiry > 0) {
    degradedReasons.push(`SSL expiring in ${ssl.daysUntilExpiry} days`);
  }

  let overallStatus: "online" | "degraded" | "offline";

  if (isDnsOk && isPort443Open && isHttpOk && isSslValid) {
    overallStatus = "online";
  } else if (!isDnsOk && !isPort443Open && http.statusCode === null) {
    overallStatus = "offline";
  } else if (isDnsOk && (isPort443Open || isHttpOk)) {
    overallStatus = "degraded";
  } else {
    // Check if anything at all is reachable
    const anyPortOpen = port80.open || port443.open || port22.open || port21.open;
    if (anyPortOpen || http.statusCode !== null) {
      overallStatus = "degraded";
    } else {
      overallStatus = "offline";
    }
  }

  const result: ServerStatusResult = {
    host,
    resolvedIp,
    resolvedIpv6,
    dnsLatencyMs,
    dnsStatus,
    ports: {
      80: port80,
      443: port443,
      22: port22,
      21: port21,
    },
    http,
    ssl,
    latencySamples,
    latencyStats,
    overallStatus,
    degradedReasons,
  };

  return NextResponse.json(result);
}