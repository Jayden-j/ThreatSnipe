import { NextRequest, NextResponse } from "next/server";
import { resolve } from "dns/promises";

// ─── DNSBL Providers ──────────────────────────────────────────────────────────

interface DnsblProvider {
  name: string;
  domain: string;
  description: string;
  /** If true, any returned IP means listed. If false, only 127.0.0.x means listed. */
  anyReturnMeansListed: boolean;
}

const DNSBL_PROVIDERS: DnsblProvider[] = [
  // ── Spamhaus (the gold standard) ──
  { name: "Spamhaus ZEN",        domain: "zen.spamhaus.org",          description: "Combined Spamhaus blocklist", anyReturnMeansListed: true },
  { name: "Spamhaus SBL",        domain: "sbl.spamhaus.org",          description: "Spamhaus SBL Data", anyReturnMeansListed: true },
  { name: "Spamhaus XBL",        domain: "xbl.spamhaus.org",          description: "Spamhaus XBL Data", anyReturnMeansListed: true },
  { name: "Spamhaus PBL",        domain: "pbl.spamhaus.org",          description: "Spamhaus PBL Data", anyReturnMeansListed: true },
  { name: "Spamhaus DBL",        domain: "dbl.spamhaus.org",          description: "Spamhaus Domain Blocklist", anyReturnMeansListed: true },

  // ── Barracuda ──
  { name: "Barracuda",           domain: "b.barracudacentral.org",    description: "Barracuda Reputation Block List", anyReturnMeansListed: true },

  // ── SURBL ──
  { name: "SURBL",               domain: "multi.surbl.org",           description: "SURBL URI reputation", anyReturnMeansListed: true },

  // ── SpamCop ──
  { name: "SpamCop",             domain: "bl.spamcop.net",            description: "SpamCop Blocking List", anyReturnMeansListed: true },

  // ── DNSBH ──
  { name: "DNSBH",               domain: "dnsbl.dnsbl.com.au",        description: "DNSBH RBL", anyReturnMeansListed: true },

  // ── Tor ──
  { name: "Tor Exit Node",       domain: "tor.dan.me.uk",             description: "Tor exit node list", anyReturnMeansListed: true },

  // ── PassiveTotal ──
  { name: "PassiveTotal",        domain: "passive.total.net",         description: "RiskIQ PassiveTotal", anyReturnMeansListed: true },

  // ── AbuseAT ──
  { name: "AbuseAT",             domain: "dnsbl.abuse.ch",            description: "Abuse.ch DNSBL", anyReturnMeansListed: true },

  // ── ThreatLog ──
  { name: "ThreatLog",           domain: "dnsbl.threatlog.org",       description: "ThreatLog DNSBL", anyReturnMeansListed: true },

  // ── Invaluement ──
  { name: "Invaluement",         domain: "dnsbl.invaluement.com",     description: "Invaluement DNSBL", anyReturnMeansListed: true },

  // ── SORBS ──
  { name: "SORBS DNSBL",         domain: "dnsbl.sorbs.net",           description: "SORBS composite", anyReturnMeansListed: true },

  // ── UCEPROTECT ──
  { name: "UCEPROTECT Level 1",  domain: "dnsbl-1.uceprotect.net",    description: "UCEPROTECT Level 1", anyReturnMeansListed: true },
  { name: "UCEPROTECT Level 2",  domain: "dnsbl-2.uceprotect.net",    description: "UCEPROTECT Level 2", anyReturnMeansListed: true },
  { name: "UCEPROTECT Level 3",  domain: "dnsbl-3.uceprotect.net",    description: "UCEPROTECT Level 3", anyReturnMeansListed: true },

  // ── PSBL ──
  { name: "PSBL",                domain: "psbl.surriel.com",           description: "Passive Spam Block List", anyReturnMeansListed: true },

  // ── SpamRats ──
  { name: "SpamRats",            domain: "bl.spamr.net",              description: "SpamRats DNSBL", anyReturnMeansListed: true },

  // ── NJABL ──
  { name: "NJABL",               domain: "dnsbl.njabl.org",           description: "NJABL DNSBL", anyReturnMeansListed: true },

  // ── HostKarma ──
  { name: "HostKarma",           domain: "hostkarma.junkemailfilter.com", description: "HostKarma RBL", anyReturnMeansListed: true },

  // ── IX.DNSBL ──
  { name: "IX.DNSBL",            domain: "dnsbl.dnsbl.net",           description: "IX DNSBL", anyReturnMeansListed: true },

  // ── CBL ──
  { name: "CBL",                 domain: "cbl.abuseat.org",           description: "Composite Blocking List", anyReturnMeansListed: true },

  // ── BGP Rank ──
  { name: "BGP Rank",            domain: "bgp.rank.net",              description: "BGP ranking DNSBL", anyReturnMeansListed: true },

  // ── Blocklist.de ──
  { name: "Blocklist.de",        domain: "bl.blocklist.de",           description: "Blocklist.de SSH/brute-force", anyReturnMeansListed: true },

  // ── Emerging Threats ──
  { name: "Emerging Threats",    domain: "dnsbl-1.uceprotect.net",    description: "Emerging Threats DNSBL", anyReturnMeansListed: true },

  // ── SpamEatingMonkey ──
  { name: "SpamEatingMonkey",    domain: "spameatingmonkey.net",      description: "SpamEatingMonkey DNSBL", anyReturnMeansListed: true },

  // ── KORO ──
  { name: "KORO",                domain: "koro.bl.koro.net",          description: "KORO DNSBL", anyReturnMeansListed: true },

  // ── RATS-NoPtr ──
  { name: "RATS-NoPtr",          domain: "dnsbl.rats-noptr.org",      description: "RATS No PTR DNSBL", anyReturnMeansListed: true },

  // ── RATS-Dyna ──
  { name: "RATS-Dyna",           domain: "dnsbl.rats-dyna.org",       description: "RATS Dyna DNSBL", anyReturnMeansListed: true },

  // ── DroneBL ──
  { name: "DroneBL",             domain: "dnsbl.dronebl.org",         description: "DroneBL drone list", anyReturnMeansListed: true },

  // ── V4B.DNSBL ──
  { name: "V4B DNSBL",           domain: "v4b.dnsbl.net",             description: "V4B DNSBL", anyReturnMeansListed: true },

  // ── RBL.JP ──
  { name: "RBL.JP",              domain: "rbl.jp",                    description: "Japan RBL", anyReturnMeansListed: true },

  // ── RBL DNSBL ──
  { name: "RBL DNSBL",           domain: "rbl.dnsbl.net",             description: "RBL DNSBL", anyReturnMeansListed: true },
];

export const maxDuration = 60; // DNSBL checks can be slow

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlacklistResult {
  provider: string;
  domain: string;
  description: string;
  listed: boolean;
  returnCode: string | null;
  returnLabel: string | null;
}

interface BlacklistResponse {
  ip: string;
  reversedIp: string;
  totalProviders: number;
  listedCount: number;
  results: BlacklistResult[];
  error?: string;
}

// ─── Spamhaus Return Code Labels ──────────────────────────────────────────────

const SPAMHAUS_CODES: Record<string, string> = {
  "127.0.0.2": "SBL — Direct Spam",
  "127.0.0.3": "CSS — Spam from compromised servers",
  "127.0.0.4": "XBL — Exploits/proxies",
  "127.0.0.5": "XBL — CBL data",
  "127.0.0.6": "XBL — CBL data",
  "127.0.0.7": "DBL — Domain block",
  "127.0.0.9": "DBL — Domain block (abused)",
  "127.0.0.10": "PBL — End-user IP range",
  "127.0.0.11": "PBL — End-user IP range",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reverseIp(ip: string): string {
  return ip.split(".").reverse().join(".");
}

function isValidIP(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((octet) => {
    const num = parseInt(octet, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && octet === String(num);
  });
}

function mapReturnCode(providerName: string, returnIp: string): { code: string | null; label: string | null } {
  if (!returnIp) return { code: null, label: null };

  // Check for Spamhaus-specific codes
  if (providerName.startsWith("Spamhaus") && SPAMHAUS_CODES[returnIp]) {
    return { code: returnIp, label: SPAMHAUS_CODES[returnIp] };
  }

  // Generic mapping
  if (returnIp.startsWith("127.")) {
    return { code: returnIp, label: `Listed (${returnIp})` };
  }

  return { code: returnIp, label: `Listed (${returnIp})` };
}

async function checkDnsbl(ip: string, provider: DnsblProvider): Promise<BlacklistResult> {
  const reversedIp = reverseIp(ip);
  const lookupDomain = `${reversedIp}.${provider.domain}`;

  try {
    const addresses = await resolve(lookupDomain);

    if (addresses.length === 0) {
      return {
        provider: provider.name,
        domain: provider.domain,
        description: provider.description,
        listed: false,
        returnCode: null,
        returnLabel: null,
      };
    }

    // Take the first returned IP
    const returnIp = addresses[0];

    if (provider.anyReturnMeansListed) {
      const { code, label } = mapReturnCode(provider.name, returnIp);
      return {
        provider: provider.name,
        domain: provider.domain,
        description: provider.description,
        listed: true,
        returnCode: code,
        returnLabel: label,
      };
    }

    // For providers where only 127.0.0.x means listed
    if (returnIp.startsWith("127.")) {
      const { code, label } = mapReturnCode(provider.name, returnIp);
      return {
        provider: provider.name,
        domain: provider.domain,
        description: provider.description,
        listed: true,
        returnCode: code,
        returnLabel: label,
      };
    }

    return {
      provider: provider.name,
      domain: provider.domain,
      description: provider.description,
      listed: false,
      returnCode: null,
      returnLabel: null,
    };
  } catch (err: unknown) {
    // NXDOMAIN or other DNS errors = not listed (for most providers)
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOTFOUND" || nodeErr.code === "ENODATA") {
      return {
        provider: provider.name,
        domain: provider.domain,
        description: provider.description,
        listed: false,
        returnCode: null,
        returnLabel: null,
      };
    }

    // Server failure or timeout — treat as "could not check"
    return {
      provider: provider.name,
      domain: provider.domain,
      description: provider.description,
      listed: false,
      returnCode: null,
      returnLabel: "DNS error",
    };
  }
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hostname = searchParams.get("hostname");

  if (!hostname) {
    return NextResponse.json(
      { error: "Missing required parameter: hostname" },
      { status: 400 }
    );
  }

  const trimmed = hostname.trim();

  // We only support IP addresses for DNSBL checking
  if (!isValidIP(trimmed)) {
    return NextResponse.json(
      { error: "DNSBL blacklist check requires a valid IPv4 address. For domains, use the Domain Lookup tool with VirusTotal." },
      { status: 400 }
    );
  }

  try {
    // Run all DNSBL checks concurrently (with connection pooling limits)
    const CONCURRENCY = 15;
    const results: BlacklistResult[] = [];

    for (let i = 0; i < DNSBL_PROVIDERS.length; i += CONCURRENCY) {
      const batch = DNSBL_PROVIDERS.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((provider) => checkDnsbl(trimmed, provider))
      );
      results.push(...batchResults);
    }

    const listedCount = results.filter((r) => r.listed).length;

    const response: BlacklistResponse = {
      ip: trimmed,
      reversedIp: reverseIp(trimmed),
      totalProviders: results.length,
      listedCount,
      results,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("DNSBL check error:", error);
    return NextResponse.json(
      { error: "Failed to complete blacklist check" },
      { status: 500 }
    );
  }
}