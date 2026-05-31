import { NextRequest } from "next/server";
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

export const maxDuration = 60;

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
  type: "ip" | "domain";
  totalProviders: number;
  listedCount: number;
  results: BlacklistResult[];
}

/** Shape of each JSON line streamed for CIDR checks */
interface CidrStreamLine {
  ip: string;
  totalIps: number;
  currentIp: number;
  listedCount: number;
  providers: string[];
  returnCodes: Array<{ provider: string; code: string | null; label: string | null }>;
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

function isValidDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".");
}

function mapReturnCode(providerName: string, returnIp: string): { code: string | null; label: string | null } {
  if (!returnIp) return { code: null, label: null };

  if (providerName.startsWith("Spamhaus") && SPAMHAUS_CODES[returnIp]) {
    return { code: returnIp, label: SPAMHAUS_CODES[returnIp] };
  }

  if (returnIp.startsWith("127.")) {
    return { code: returnIp, label: `Listed (${returnIp})` };
  }

  return { code: returnIp, label: `Listed (${returnIp})` };
}

/** Expand a CIDR string (e.g. "192.168.1.0/24") into individual IPs */
function expandCidr(cidr: string): { ips: string[]; error?: string } {
  const match = cidr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
  if (!match) return { ips: [], error: "Invalid CIDR format. Use e.g. 192.168.1.0/24" };

  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  const c = parseInt(match[3], 10);
  const d = parseInt(match[4], 10);
  const mask = parseInt(match[5], 10);

  if (a > 255 || b > 255 || c > 255 || d > 255) {
    return { ips: [], error: "Invalid octet value in CIDR" };
  }
  if (mask < 0 || mask > 32) {
    return { ips: [], error: "Invalid subnet mask" };
  }
  if (mask < 24) {
    return { ips: [], error: "CIDR range too large — maximum /24 (256 IPs)" };
  }

  const hostBits = 32 - mask;
  const count = 1 << hostBits;

  const ipBase = (a << 24) + (b << 16) + (c << 8) + d;
  const networkBase = ipBase & (0xffffffff << hostBits);

  const ips: string[] = [];
  for (let i = 0; i < count; i++) {
    const val = networkBase + i;
    ips.push([
      (val >>> 24) & 0xff,
      (val >>> 16) & 0xff,
      (val >>> 8) & 0xff,
      val & 0xff,
    ].join("."));
  }

  return { ips };
}

async function checkDnsbl(ip: string, provider: DnsblProvider, isDomain: boolean): Promise<BlacklistResult> {
  const lookupDomain = isDomain
    ? `${ip}.${provider.domain}`   // direct: domain.provider
    : `${reverseIp(ip)}.${provider.domain}`;  // reversed: reversed-ip.provider

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

/** Check all providers for a single IP with concurrency batching */
async function checkIpAgainstAllProviders(ip: string, isDomain: boolean): Promise<{
  listedCount: number;
  providers: string[];
  returnCodes: Array<{ provider: string; code: string | null; label: string | null }>;
}> {
  const CONCURRENCY = 15;
  const results: BlacklistResult[] = [];

  for (let i = 0; i < DNSBL_PROVIDERS.length; i += CONCURRENCY) {
    const batch = DNSBL_PROVIDERS.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((provider) => checkDnsbl(ip, provider, isDomain))
    );
    results.push(...batchResults);
  }

  const listed = results.filter((r) => r.listed);
  return {
    listedCount: listed.length,
    providers: listed.map((r) => r.provider),
    returnCodes: listed.map((r) => ({
      provider: r.provider,
      code: r.returnCode,
      label: r.returnLabel,
    })),
  };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, target } = body as { type?: string; target?: string };

    if (!type || !target) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, target" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const trimmed = String(target).trim();

    if (type === "ip") {
      if (!isValidIP(trimmed)) {
        return new Response(
          JSON.stringify({ error: "Invalid IPv4 address" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const CONCURRENCY = 15;
      const results: BlacklistResult[] = [];

      for (let i = 0; i < DNSBL_PROVIDERS.length; i += CONCURRENCY) {
        const batch = DNSBL_PROVIDERS.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map((provider) => checkDnsbl(trimmed, provider, false))
        );
        results.push(...batchResults);
      }

      const response: BlacklistResponse = {
        ip: trimmed,
        reversedIp: reverseIp(trimmed),
        type: "ip",
        totalProviders: results.length,
        listedCount: results.filter((r) => r.listed).length,
        results,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "domain") {
      if (!isValidDomain(trimmed)) {
        return new Response(
          JSON.stringify({ error: "Invalid domain" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const results: BlacklistResult[] = [];
      const CONCURRENCY = 15;

      for (let i = 0; i < DNSBL_PROVIDERS.length; i += CONCURRENCY) {
        const batch = DNSBL_PROVIDERS.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map((provider) => checkDnsbl(trimmed, provider, true))
        );
        results.push(...batchResults);
      }

      const response: BlacklistResponse = {
        ip: trimmed,
        reversedIp: "",
        type: "domain",
        totalProviders: results.length,
        listedCount: results.filter((r) => r.listed).length,
        results,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "cidr") {
      const { ips, error } = expandCidr(trimmed);
      if (error) {
        return new Response(
          JSON.stringify({ error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (ips.length === 0) {
        return new Response(
          JSON.stringify({ error: "No IPs in range" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Stream JSON lines back
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const totalIps = ips.length;
          const IP_CONCURRENCY = 20; // process 20 IPs at a time

          try {
            for (let i = 0; i < ips.length; i += IP_CONCURRENCY) {
              const batch = ips.slice(i, i + IP_CONCURRENCY);
              const batchResults = await Promise.allSettled(
                batch.map(async (ip) => {
                  const result = await checkIpAgainstAllProviders(ip, false);
                  return { ip, result };
                })
              );

              for (const settled of batchResults) {
                if (settled.status === "fulfilled") {
                  const { ip, result: ipResult } = settled.value;
                  const line: CidrStreamLine = {
                    ip,
                    totalIps,
                    currentIp: ips.indexOf(ip) + 1,
                    listedCount: ipResult.listedCount,
                    providers: ipResult.providers,
                    returnCodes: ipResult.returnCodes,
                  };
                  controller.enqueue(encoder.encode(JSON.stringify(line) + "\n"));
                }
                // On rejection, we still send an error line so the client
                // can track progress and show the error
                if (settled.status === "rejected") {
                  // Find a placeholder ip — not perfect, but rare
                  const idx = batchResults.indexOf(settled);
                  const fallbackIp = batch[idx] ?? "unknown";
                  const errorLine: CidrStreamLine & { error: string } = {
                    ip: fallbackIp,
                    totalIps,
                    currentIp: ips.indexOf(fallbackIp) + 1,
                    listedCount: 0,
                    providers: [],
                    returnCodes: [],
                    error: "Check failed",
                  };
                  controller.enqueue(encoder.encode(JSON.stringify(errorLine) + "\n"));
                }
              }
            }

            // Sentinel to mark completion
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "dnsbl-complete", totalIps }) + "\n")
            );
          } catch (err) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "dnsbl-error", error: String(err) }) + "\n"
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson",
          "X-Accel-Buffering": "no",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new Response(
      JSON.stringify({ error: `Invalid type: ${type}. Use "ip", "domain", or "cidr".` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Blacklist check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to complete blacklist check" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── GET Handler (legacy) ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hostname = searchParams.get("hostname");

  if (!hostname) {
    return new Response(
      JSON.stringify({ error: "Missing required parameter: hostname" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const trimmed = hostname.trim();

  if (!isValidIP(trimmed)) {
    return new Response(
      JSON.stringify({ error: "DNSBL blacklist check requires a valid IPv4 address." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const CONCURRENCY = 15;
    const results: BlacklistResult[] = [];

    for (let i = 0; i < DNSBL_PROVIDERS.length; i += CONCURRENCY) {
      const batch = DNSBL_PROVIDERS.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((provider) => checkDnsbl(trimmed, provider, false))
      );
      results.push(...batchResults);
    }

    const listedCount = results.filter((r) => r.listed).length;

    const response: BlacklistResponse = {
      ip: trimmed,
      reversedIp: reverseIp(trimmed),
      type: "ip",
      totalProviders: results.length,
      listedCount,
      results,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DNSBL check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to complete blacklist check" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}