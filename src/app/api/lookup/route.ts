import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authenticate } from "@/lib/api-auth";
import { ratelimit } from "@/lib/ratelimit";

interface AbuseIPDBResponse {
  data?: {
    ipAddress: string;
    abuseConfidenceScore: number;
    countryCode: string;
    isp: string;
    totalReports: number;
    lastReportedAt: string | null;
  };
  errors?: Array<{
    detail: string;
  }>;
}

interface GoogleDnsResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

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

function isValidDomain(domain: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain) && domain.length <= 253;
}

function cleanDomain(input: string): string {
  let cleaned = input.replace(/^https?:\/\//i, "");
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.replace(/\.+$/, "");
  return cleaned.trim().toLowerCase();
}

async function resolveDomainToIP(domain: string): Promise<string> {
  const clean = cleanDomain(domain);
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=A`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to resolve domain via Google DNS");
  }

  const data: GoogleDnsResponse = await response.json();

  if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
    throw new Error("Domain resolution returned no A records");
  }

  // Find the first A record (type 1)
  const aRecord = data.Answer.find((record) => record.type === 1);
  if (!aRecord) {
    throw new Error("No A record found for domain");
  }

  return aRecord.data;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.userId) {
    const { success } = await ratelimit.limit(auth.userId);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");
  const input = searchParams.get("input");

  const rawInput = input || ip || "";

  if (!rawInput) {
    return NextResponse.json(
      { error: "Missing required parameter: ip or input" },
      { status: 400 }
    );
  }

  let targetIp: string;
  let originalInput: string = rawInput;
  let isDomain = false;
  let resolvedIp: string | null = null;

  if (isValidIP(rawInput)) {
    targetIp = rawInput;
  } else if (isValidDomain(rawInput)) {
    isDomain = true;
    originalInput = rawInput;
    try {
      resolvedIp = await resolveDomainToIP(rawInput);
      targetIp = resolvedIp;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to resolve domain to IP address",
        },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Invalid IP address or domain format" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ABUSEIPDB_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json(
      { error: "AbuseIPDB API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(targetIp)}&maxAgeInDays=90`,
      {
        headers: {
          Key: apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            errorData?.errors?.[0]?.detail || "AbuseIPDB API request failed",
        },
        { status: 500 }
      );
    }

    const data: AbuseIPDBResponse = await response.json();

    if (!data.data) {
      return NextResponse.json(
        { error: "Unexpected response from AbuseIPDB" },
        { status: 500 }
      );
    }

    // Format the response
    const result = {
      ip: data.data.ipAddress,
      abuseScore: data.data.abuseConfidenceScore,
      country: data.data.countryCode,
      isp: data.data.isp,
      totalReports: data.data.totalReports,
      lastReported: data.data.lastReportedAt,
      originalInput: isDomain ? originalInput : undefined,
      isDomain: isDomain || undefined,
      resolvedIp: isDomain ? resolvedIp : undefined,
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
        const abuseScore = data.data.abuseConfidenceScore;
        const threatLevel =
          abuseScore < 15 ? "CLEAN" :
          abuseScore <= 50 ? "SUSPICIOUS" :
          "THREAT";

        const { data: scanRecord } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            ip_address: data.data.ipAddress,
            abuse_score: abuseScore,
            country: data.data.countryCode,
            isp: data.data.isp,
            total_reports: data.data.totalReports,
            last_reported: data.data.lastReportedAt,
            threat_level: threatLevel,
            read: false,
            domain: isDomain ? originalInput : null,
          })
          .select("id")
          .single();

      }
    } catch (dbError) {
      // Log but don't fail the request if scan save fails
      console.error("Failed to save scan to database:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AbuseIPDB lookup error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AbuseIPDB API" },
      { status: 500 }
    );
  }
}