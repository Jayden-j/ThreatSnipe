import { NextRequest, NextResponse } from "next/server";
import { lookup } from "whois";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhoisResult {
  domain: string;
  registrar: string;
  creationDate: string;
  expirationDate: string;
  updatedDate: string;
  nameServers: string[];
  registrantName: string;
  registrantOrganization: string;
  registrantCountry: string;
  registrantEmail: string;
  rawText: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractField(text: string, ...patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "—";
}

function extractMultiple(text: string, ...patterns: RegExp[]): string[] {
  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    const results = Array.from(matches, (m) => m[1].trim()).filter(Boolean);
    if (results.length > 0) return results;
  }
  return [];
}

function cleanDomain(input: string): string {
  let cleaned = input.replace(/^https?:\/\//i, "");
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.replace(/\.+$/, "");
  return cleaned.trim().toLowerCase();
}

function isValidDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".") && !domain.includes(" ");
}

function parseWhoisOutput(text: string, domain: string): WhoisResult {
  // Try to parse common WHOIS fields
  const registrar = extractField(
    text,
    /^Registrar:\s*(.+)$/im,
    /^Sponsoring Registrar:\s*(.+)$/im,
    /^Registrar Name:\s*(.+)$/im,
    /^registrar:\s*(.+)$/im
  );

  const creationDate = extractField(
    text,
    /^Creation Date:\s*(.+)$/im,
    /^Created Date:\s*(.+)$/im,
    /^created:\s*(.+)$/im,
    /^Domain Registration Date:\s*(.+)$/im
  );

  const expirationDate = extractField(
    text,
    /^Registrar Registration Expiration Date:\s*(.+)$/im,
    /^Expiration Date:\s*(.+)$/im,
    /^Expiry Date:\s*(.+)$/im,
    /^expire:\s*(.+)$/im,
    /^paid-till:\s*(.+)$/im
  );

  const updatedDate = extractField(
    text,
    /^Updated Date:\s*(.+)$/im,
    /^Last Modified:\s*(.+)$/im,
    /^changed:\s*(.+)$/im,
    /^Last Update:\s*(.+)$/im
  );

  const nameServers = extractMultiple(
    text,
    /^Name Server:\s*(.+)$/im,
    /^nserver:\s*(.+)$/im,
    /^Nameserver:\s*(.+)$/im
  );

  const registrantName = extractField(
    text,
    /^Registrant Name:\s*(.+)$/im,
    /^Registrant:\s*(.+)$/im,
    /^owner:\s*(.+)$/im,
    /^person:\s*(.+)$/im
  );

  const registrantOrganization = extractField(
    text,
    /^Registrant Organization:\s*(.+)$/im,
    /^org:\s*(.+)$/im,
    /^organisation:\s*(.+)$/im
  );

  const registrantCountry = extractField(
    text,
    /^Registrant Country:\s*(.+)$/im,
    /^country:\s*(.+)$/im
  );

  const registrantEmail = extractField(
    text,
    /^Registrant Email:\s*(.+)$/im,
    /^e-mail:\s*(.+)$/im,
    /^email:\s*(.+)$/im
  );

  // Truncate raw text to avoid excessively large responses
  const truncatedText = text.length > 4000 ? text.slice(0, 4000) + "\n\n... (truncated)" : text;

  return {
    domain,
    registrar,
    creationDate,
    expirationDate,
    updatedDate,
    nameServers,
    registrantName,
    registrantOrganization,
    registrantCountry,
    registrantEmail,
    rawText: truncatedText,
  };
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // Use the whois npm package (cross-platform, no system command needed)
    let rawOutput: string;

    try {
      rawOutput = await new Promise<string>((resolve, reject) => {
        lookup(domain, { follow: 2, timeout: 15000 }, (err: Error | null, data: string | import("whois").WhoisResult[]) => {
          if (err) {
            reject(err);
          } else {
            // Non-verbose mode returns a string, verbose returns an array
            resolve(typeof data === "string" ? data : data.map((r) => r.data).join("\n\n"));
          }
        });
      });
    } catch (lookupErr) {
      console.error("WHOIS lookup error:", lookupErr);
      rawOutput = "WHOIS lookup failed. Unable to retrieve WHOIS data for this domain.";
    }

    const result = parseWhoisOutput(rawOutput, domain);
    return NextResponse.json(result);
  } catch (error) {
    console.error("WHOIS lookup error:", error);
    return NextResponse.json(
      { error: "Failed to perform WHOIS lookup" },
      { status: 500 }
    );
  }
}