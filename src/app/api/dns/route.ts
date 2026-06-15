import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { ratelimit } from "@/lib/ratelimit";
import {
  resolve,
  resolve4,
  resolve6,
  resolveMx,
  resolveTxt,
  resolveCname,
  resolveNs,
  resolveSoa,
  resolvePtr,
} from "dns/promises";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

interface DnsResult {
  domain: string;
  records: DnsRecord[];
  summary: {
    a: number;
    aaaa: number;
    mx: number;
    txt: number;
    cname: number;
    ns: number;
    soa: number;
    ptr: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanDomain(input: string): string {
  let cleaned = input.replace(/^https?:\/\//i, "");
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.replace(/\.+$/, "");
  return cleaned.trim().toLowerCase();
}

function isValidDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".") && !domain.includes(" ");
}

async function safeResolve<T>(
  resolver: () => Promise<T>,
  type: string,
  formatter: (val: T) => DnsRecord[]
): Promise<DnsRecord[]> {
  try {
    const result = await resolver();
    return formatter(result);
  } catch {
    return [];
  }
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.userId) {
    const { success } = await ratelimit.limit(auth.userId);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const hostname = searchParams.get("hostname");

  if (!hostname) {
    return NextResponse.json(
      { error: "Missing required parameter: hostname" },
      { status: 400 }
    );
  }

  const domain = cleanDomain(hostname);

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "Invalid domain or URL" },
      { status: 400 }
    );
  }

  try {
    // Run all DNS lookups concurrently
    const [aRecords, aaaaRecords, mxRecords, txtRecords, cnameRecords, nsRecords, soaRecords, ptrRecords] =
      await Promise.all([
        safeResolve(() => resolve4(domain), "A", (vals) =>
          vals.map((v) => ({ type: "A", value: v }))
        ),
        safeResolve(() => resolve6(domain), "AAAA", (vals) =>
          vals.map((v) => ({ type: "AAAA", value: v }))
        ),
        safeResolve(() => resolveMx(domain), "MX", (vals) =>
          vals.map((v) => ({
            type: "MX",
            value: `${v.priority} ${v.exchange}`,
          }))
        ),
        safeResolve(() => resolveTxt(domain), "TXT", (vals) =>
          vals.map((v) => ({
            type: "TXT",
            value: v.join(" "),
          }))
        ),
        safeResolve(() => resolveCname(domain), "CNAME", (vals) =>
          vals.map((v) => ({ type: "CNAME", value: v }))
        ),
        safeResolve(() => resolveNs(domain), "NS", (vals) =>
          vals.map((v) => ({ type: "NS", value: v }))
        ),
        safeResolve(() => resolveSoa(domain), "SOA", (vals) => [
          {
            type: "SOA",
            value: `nsname=${vals.nsname} hostmaster=${vals.hostmaster} serial=${vals.serial} refresh=${vals.refresh} retry=${vals.retry} expire=${vals.expire} minttl=${vals.minttl}`,
          },
        ]),
        safeResolve(() => resolvePtr(domain), "PTR", (vals) =>
          vals.map((v) => ({ type: "PTR", value: v }))
        ),
      ]);

    const records = [
      ...aRecords,
      ...aaaaRecords,
      ...mxRecords,
      ...txtRecords,
      ...cnameRecords,
      ...nsRecords,
      ...soaRecords,
      ...ptrRecords,
    ];

    // Fallback: if no records found, try a general resolve
    if (records.length === 0) {
      try {
        const general = await resolve(domain);
        for (const addr of general) {
          records.push({ type: "A/AAAA", value: addr });
        }
      } catch {
        // no fallback records either
      }
    }

    const result: DnsResult = {
      domain,
      records,
      summary: {
        a: aRecords.length,
        aaaa: aaaaRecords.length,
        mx: mxRecords.length,
        txt: txtRecords.length,
        cname: cnameRecords.length,
        ns: nsRecords.length,
      soa: soaRecords.length > 0 ? 1 : 0,
        ptr: ptrRecords.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("DNS lookup error:", error);
    return NextResponse.json(
      { error: "Failed to perform DNS lookup" },
      { status: 500 }
    );
  }
}