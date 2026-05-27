import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

interface VirusTotalResponse {
  data?: {
    attributes: {
      last_analysis_stats: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
      };
      reputation: number;
      categories: Record<string, string>;
      last_analysis_date: number;
    };
  };
  error?: {
    message: string;
  };
}

interface DomainResult {
  domain: string;
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  reputation: number;
  categories: string[];
  lastAnalysisDate: string;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
}

function cleanDomain(input: string): string {
  // Remove protocol
  let cleaned = input.replace(/^https?:\/\//i, "");
  // Remove trailing slashes and paths
  cleaned = cleaned.split("/")[0];
  // Remove trailing dots
  cleaned = cleaned.replace(/\.+$/, "");
  return cleaned.trim();
}

function isValidDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".");
}

function getVerdict(malicious: number, suspicious: number): "CLEAN" | "SUSPICIOUS" | "MALICIOUS" {
  if (malicious > 0) return "MALICIOUS";
  if (suspicious > 0) return "SUSPICIOUS";
  return "CLEAN";
}

function formatUnixTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainInput = searchParams.get("domain");

  if (!domainInput) {
    return NextResponse.json(
      { error: "Missing required parameter: domain" },
      { status: 400 }
    );
  }

  const domain = cleanDomain(domainInput);

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "Invalid domain or URL" },
      { status: 400 }
    );
  }

  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey || apiKey === "your_virustotal_api_key") {
    return NextResponse.json(
      { error: "VirusTotal API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`,
      {
        headers: {
          "x-apikey": apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            errorData?.error?.message || "Failed to fetch domain reputation",
        },
        { status: 500 }
      );
    }

    const data: VirusTotalResponse = await response.json();

    if (!data.data) {
      return NextResponse.json(
        { error: "Unexpected response from VirusTotal" },
        { status: 500 }
      );
    }

    const attrs = data.data.attributes;
    const stats = attrs.last_analysis_stats;
    const malicious = stats.malicious;
    const suspicious = stats.suspicious;
    const verdict = getVerdict(malicious, suspicious);

    const result: DomainResult = {
      domain,
      harmless: stats.harmless,
      malicious,
      suspicious,
      undetected: stats.undetected,
      reputation: attrs.reputation,
      categories: Object.values(attrs.categories || {}),
      lastAnalysisDate: formatUnixTimestamp(attrs.last_analysis_date),
      verdict,
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
        await supabase.from("domain_scans").insert({
          user_id: user.id,
          domain,
          malicious,
          suspicious,
          harmless: stats.harmless,
          undetected: stats.undetected,
          reputation: attrs.reputation,
          categories: Object.values(attrs.categories || {}),
          last_analysis_date: formatUnixTimestamp(attrs.last_analysis_date),
          verdict,
        });
      }
    } catch (dbError) {
      // Log but don't fail the request if scan save fails
      console.error("Failed to save domain scan to database:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("VirusTotal lookup error:", error);
    return NextResponse.json(
      { error: "Failed to connect to VirusTotal API" },
      { status: 500 }
    );
  }
}