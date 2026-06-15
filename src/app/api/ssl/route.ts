import { NextRequest, NextResponse } from "next/server";
import * as tls from "tls";
import { authenticate } from "@/lib/api-auth";
import { ratelimit } from "@/lib/ratelimit";

interface SslResult {
  host: string;
  subject: { cn: string; org: string };
  issuer: { cn: string; org: string };
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  protocol: string;
  serialNumber: string;
  sanList: string[];
}

function extractCN(
  obj: Record<string, string | string[] | undefined> | undefined,
  ...keys: string[]
): string {
  if (!obj) return "";
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string") return val;
    if (Array.isArray(val) && val.length > 0) return val[0];
  }
  return "";
}

function getOrg(obj: Record<string, string | string[] | undefined> | undefined): string {
  if (!obj) return "";
  const o = obj.O || obj.organizationName;
  if (typeof o === "string") return o;
  if (Array.isArray(o) && o.length > 0) return o[0];
  return "";
}

function isBlockedHost(host: string): boolean {
  if (/^localhost$/i.test(host)) return true;
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(host) || host === "::1";
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

  try {
    const result = await new Promise<SslResult>((resolve, reject) => {
      const socket = tls.connect(
        {
          host,
          port: 443,
          servername: host,
          rejectUnauthorized: false,
          timeout: 10000,
        },
        () => {
          const cert = socket.getPeerCertificate();

          if (!cert || Object.keys(cert).length === 0) {
            reject(new Error("No certificate received from server"));
            socket.end();
            return;
          }

          const validFrom = cert.valid_from;
          const validTo = cert.valid_to;
          const now = new Date();
          const expiryDate = new Date(validTo);
          const daysUntilExpiry = Math.floor(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const sslResult: SslResult = {
            host,
            subject: {
              cn: extractCN(cert.subject, "CN", "commonName"),
              org: getOrg(cert.subject),
            },
            issuer: {
              cn: extractCN(cert.issuer, "CN", "commonName"),
              org: getOrg(cert.issuer),
            },
            validFrom,
            validTo,
            daysUntilExpiry,
            isExpired: daysUntilExpiry < 0,
            isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
            protocol: socket.getProtocol() || "Unknown",
            serialNumber: cert.serialNumber || "",
            sanList: cert.subjectaltname
              ? cert.subjectaltname
                  .split(/, /)
                  .map((s: string) => s.replace(/^DNS:/, ""))
              : [],
          };

          socket.end();
          resolve(sslResult);
        }
      );

      socket.on("error", (err: Error) => {
        socket.destroy();
        reject(new Error(`TLS connection failed: ${err.message}`));
      });

      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("Connection timed out"));
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("SSL check error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check SSL certificate",
      },
      { status: 500 }
    );
  }
}