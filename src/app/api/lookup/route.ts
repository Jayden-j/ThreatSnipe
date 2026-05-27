import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json(
      { error: "Missing required parameter: ip" },
      { status: 400 }
    );
  }

  if (!isValidIP(ip)) {
    return NextResponse.json(
      { error: "Invalid IP address format" },
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
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
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

    return NextResponse.json({
      ip: data.data.ipAddress,
      abuseScore: data.data.abuseConfidenceScore,
      country: data.data.countryCode,
      isp: data.data.isp,
      totalReports: data.data.totalReports,
      lastReported: data.data.lastReportedAt,
    });
  } catch (error) {
    console.error("AbuseIPDB lookup error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AbuseIPDB API" },
      { status: 500 }
    );
  }
}
