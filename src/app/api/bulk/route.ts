import { NextRequest, NextResponse } from "next/server";
import { resolve4 } from "dns/promises";
import { createClient } from "@/lib/supabase/server";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_TARGETS = 20;

const DNSBL_PROVIDERS = [
  "zen.spamhaus.org",
  "bl.spamcop.net",
  "dnsbl.sorbs.net",
  "b.barracudacentral.org",
  "dnsbl-1.uceprotect.net",
  "dnsbl-2.uceprotect.net",
  "dnsbl-3.uceprotect.net",
  "all.s5h.net",
  "dnsbl.dronebl.org",
  "rbl.interserver.net",
  "z.mailspike.net",
  "spam.dnsbl.sorbs.net",
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BulkResult {
  target: string;
  type: "ip" | "domain";
  status: "threat" | "suspicious" | "clean" | "error";
  // AbuseIPDB (IPs only)
  abuseScore?: number;
  isp?: string;
  country?: string;
  totalReports?: number;
  // VirusTotal (domains only)
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  totalEngines?: number;
  // DNSBL (both)
  dnsblListedOn: string[];
  dnsblChecked: number;
  // Meta
  checkedAt: string;
  error?: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  if (ipv4Match) {
    return ipv4Match.slice(1).every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  return false;
}

function cleanDomain(input: string): string {
  let cleaned = input.replace(/^https?:\/\//i, "");
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.replace(/\.+$/, "");
  return cleaned.trim().toLowerCase();
}

function isValidDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".");
}

function detectType(target: string): "ip" | "domain" {
  return isValidIP(target) ? "ip" : "domain";
}

// ─── DNSBL Check ──────────────────────────────────────────────────────────────

async function checkDNSBL(
  lookupHostname: string
): Promise<{ listedOn: string[]; checked: number }> {
  const listedOn: string[] = [];
  let checked = 0;

  await Promise.allSettled(
    DNSBL_PROVIDERS.map(async (provider) => {
      const queryHost = `${lookupHostname}.${provider}`;
      try {
        await resolve4(queryHost);
        listedOn.push(provider);
      } catch {
        // NXDOMAIN = not listed, that's fine
      }
      checked++;
    })
  );

  return { listedOn, checked };
}

// ─── AbuseIPDB Lookup (IPs) ──────────────────────────────────────────────────

interface AbuseIPDBResponse {
  data?: {
    ipAddress: string;
    abuseConfidenceScore: number;
    countryCode: string;
    isp: string;
    totalReports: number;
  };
  errors?: Array<{ detail: string }>;
}

async function lookupAbuseIPDB(ip: string): Promise<{
  abuseScore: number;
  isp: string;
  country: string;
  totalReports: number;
} | null> {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return null;

  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
      {
        headers: { Key: apiKey, Accept: "application/json" },
      }
    );
    if (!response.ok) return null;

    const data: AbuseIPDBResponse = await response.json();
    if (!data.data) return null;

    return {
      abuseScore: data.data.abuseConfidenceScore,
      isp: data.data.isp,
      country: data.data.countryCode,
      totalReports: data.data.totalReports,
    };
  } catch {
    return null;
  }
}

// ─── VirusTotal Lookup (Domains) ────────────────────────────────────────────

interface VirusTotalResponse {
  data?: {
    attributes: {
      last_analysis_stats: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
      };
    };
  };
  error?: { message: string };
}

async function lookupVirusTotal(domain: string): Promise<{
  malicious: number;
  suspicious: number;
  harmless: number;
  totalEngines: number;
} | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey || apiKey === "your_virustotal_api_key") return null;

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`,
      {
        headers: { "x-apikey": apiKey, Accept: "application/json" },
      }
    );
    if (!response.ok) return null;

    const data: VirusTotalResponse = await response.json();
    if (!data.data) return null;

    const stats = data.data.attributes.last_analysis_stats;
    return {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless,
      totalEngines:
        stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
    };
  } catch {
    return null;
  }
}

// ─── Determine Status ────────────────────────────────────────────────────────

function determineStatus(params: {
  abuseScore?: number;
  malicious?: number;
  suspicious?: number;
  dnsblListedOn: string[];
  abuseFailed?: boolean;
  vtFailed?: boolean;
}): BulkResult["status"] {
  const { abuseScore, malicious, suspicious, dnsblListedOn, abuseFailed, vtFailed } = params;

  // If the primary check(s) failed AND DNSBL also failed = error
  const primaryFailed = abuseFailed ?? false;
  const primaryFailedDomain = vtFailed ?? false;
  if ((primaryFailed || primaryFailedDomain) && dnsblListedOn.length === 0) {
    return "error";
  }

  // threat
  if ((abuseScore ?? 0) > 50 || (malicious ?? 0) > 0 || dnsblListedOn.length > 0) {
    return "threat";
  }

  // suspicious
  if ((abuseScore ?? 0) > 25 || (suspicious ?? 0) > 2) {
    return "suspicious";
  }

  return "clean";
}

// ─── Process Single Target ───────────────────────────────────────────────────

async function processTarget(target: string): Promise<BulkResult> {
  const type = detectType(target);
  const now = new Date().toISOString();

  if (type === "ip") {
    // Run AbuseIPDB + DNSBL in parallel
    const dnsblLookupHost = target.split(".").reverse().join(".");
    const [abuseResult, dnsblResult] = await Promise.all([
      lookupAbuseIPDB(target),
      checkDNSBL(dnsblLookupHost),
    ]);

    const status = determineStatus({
      abuseScore: abuseResult?.abuseScore,
      dnsblListedOn: dnsblResult.listedOn,
      abuseFailed: abuseResult === null,
    });

    return {
      target,
      type: "ip",
      status,
      abuseScore: abuseResult?.abuseScore,
      isp: abuseResult?.isp,
      country: abuseResult?.country,
      totalReports: abuseResult?.totalReports,
      dnsblListedOn: dnsblResult.listedOn,
      dnsblChecked: dnsblResult.checked,
      checkedAt: now,
    };
  } else {
    // Domain: VirusTotal + DNSBL (prepend domain directly)
    const [vtResult, dnsblResult] = await Promise.all([
      lookupVirusTotal(target),
      checkDNSBL(target),
    ]);

    const status = determineStatus({
      malicious: vtResult?.malicious,
      suspicious: vtResult?.suspicious,
      dnsblListedOn: dnsblResult.listedOn,
      vtFailed: vtResult === null,
      abuseFailed: false,
    });

    return {
      target,
      type: "domain",
      status,
      malicious: vtResult?.malicious,
      suspicious: vtResult?.suspicious,
      harmless: vtResult?.harmless,
      totalEngines: vtResult?.totalEngines,
      dnsblListedOn: dnsblResult.listedOn,
      dnsblChecked: dnsblResult.checked,
      checkedAt: now,
    };
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { targets } = body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty targets array" },
        { status: 400 }
      );
    }

    if (targets.length > MAX_TARGETS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_TARGETS} targets allowed` },
        { status: 400 }
      );
    }

    // Validate and classify each target
    const validatedTargets: { raw: string; cleaned: string; type: "ip" | "domain" }[] = [];
    for (const raw of targets) {
      const trimmed = String(raw).trim();
      if (!trimmed) continue;

      const type = detectType(trimmed);

      if (type === "domain") {
        const cleaned = cleanDomain(trimmed);
        if (!isValidDomain(cleaned)) continue;
        validatedTargets.push({ raw: trimmed, cleaned, type });
      } else {
        validatedTargets.push({ raw: trimmed, cleaned: trimmed, type });
      }
    }

    if (validatedTargets.length === 0) {
      return NextResponse.json(
        { error: "No valid targets provided" },
        { status: 400 }
      );
    }

    // Run all targets in parallel
    const results = await Promise.allSettled(
      validatedTargets.map((t) => processTarget(t.cleaned))
    );

    const output: BulkResult[] = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return r.value;
      }
      return {
        target: validatedTargets[i].raw,
        type: validatedTargets[i].type,
        status: "error",
        dnsblListedOn: [],
        dnsblChecked: 0,
        checkedAt: new Date().toISOString(),
        error: r.reason instanceof Error ? r.reason.message : "Unknown error",
      };
    });

    return NextResponse.json(output);
  } catch (error) {
    console.error("Bulk check error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk check" },
      { status: 500 }
    );
  }
}