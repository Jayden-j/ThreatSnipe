import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { sendAlertNotification } from "@/lib/notify";

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
  inputType: "domain" | "ip";
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

  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey || apiKey === "your_virustotal_api_key") {
    return NextResponse.json(
      { error: "VirusTotal API key is not configured" },
      { status: 500 }
    );
  }

  // Auto-detect if input is IP or domain
  let isIp = false;
  let target: string;

  if (isValidIP(domainInput)) {
    isIp = true;
    target = domainInput;
  } else {
    const cleaned = cleanDomain(domainInput);
    if (!isValidDomain(cleaned)) {
      return NextResponse.json(
        { error: "Invalid domain or IP address" },
        { status: 400 }
      );
    }
    target = cleaned;
  }

  try {
    let url: string;
    if (isIp) {
      url = `https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(target)}`;
    } else {
      url = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(target)}`;
    }

    const response = await fetch(url, {
      headers: {
        "x-apikey": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            errorData?.error?.message || "Failed to fetch reputation data",
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
      domain: target,
      harmless: stats.harmless,
      malicious,
      suspicious,
      undetected: stats.undetected,
      reputation: attrs.reputation,
      categories: Object.values(attrs.categories || {}),
      lastAnalysisDate: formatUnixTimestamp(attrs.last_analysis_date),
      verdict,
      inputType: isIp ? "ip" : "domain",
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
          .from("domain_scans")
          .insert({
            user_id: user.id,
            domain: target,
            malicious,
            suspicious,
            harmless: stats.harmless,
            undetected: stats.undetected,
            reputation: attrs.reputation,
            categories: Object.values(attrs.categories || {}),
            last_analysis_date: formatUnixTimestamp(attrs.last_analysis_date),
            verdict,
            read: false,
            input_type: isIp ? "ip" : "domain",
          })
          .select("id")
          .single();

        // Insert alert based on domain verdict
        if (verdict !== "CLEAN" && scanRecord?.id) {
          const severity =
            malicious > 0 ? "critical" : suspicious > 3 ? "high" : "medium";

          try {
            const serviceSupabase = createServiceClient();
            await serviceSupabase.from("alerts").insert({
              user_id: user.id,
              source_table: "domain_scans",
              source_record_id: scanRecord.id,
              severity,
              category: "malicious_domain",
              title: `${isIp ? "IP" : "Domain"} Alert: ${target}`,
              message: `${malicious} malicious, ${suspicious} suspicious — Reputation: ${attrs.reputation}`,
              metadata: {
                [isIp ? "ip_address" : "domain"]: target,
                malicious,
                suspicious,
                reputation: attrs.reputation,
                verdict,
                input_type: isIp ? "ip" : "domain",
              },
            });
          } catch (alertError) {
            console.error("Failed to insert alert:", alertError);
          }

          // Fire notification for MALICIOUS verdicts (non-blocking)
          if (verdict === "MALICIOUS") {
            sendAlertNotification({
              userId: user.id,
              severity: severity as "critical" | "high" | "medium" | "low",
              category: "malicious_domain",
              title: `Malicious ${isIp ? "IP" : "Domain"}: ${target}`,
              target,
              details: {
                "Malicious Engines": malicious,
                "Suspicious Engines": suspicious,
                Reputation: attrs.reputation,
              },
              rescanPath: `/domain?domain=${encodeURIComponent(target)}`,
            }).catch((err) => console.error("Notify error:", err));
          }
        }
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