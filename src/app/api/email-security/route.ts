import { NextRequest, NextResponse } from "next/server";
import * as dns from "dns/promises";

const DKIM_SELECTORS = ["default", "google", "k1", "selector1", "selector2"];

interface SpfResult {
  raw: string | null;
  grade: string;
  verdict: string;
  mechanisms: string[];
}

interface DkimResult {
  found: boolean;
  selector: string | null;
  raw: string | null;
  grade: string;
  verdict: string;
}

interface DmarcResult {
  raw: string | null;
  grade: string;
  policy: string;
  rua: string | null;
  pct: number;
  verdict: string;
}

interface EmailSecurityResult {
  domain: string;
  spf: SpfResult;
  dkim: DkimResult;
  dmarc: DmarcResult;
  overallGrade: string;
}

function gradeToVerdict(grade: string): string {
  switch (grade) {
    case "A":
      return "Strong protection — well configured";
    case "B":
      return "Good protection — minor improvements possible";
    case "C":
      return "Moderate protection — could be improved";
    case "D":
      return "Weak protection — improvements recommended";
    case "F":
      return "No protection or misconfigured";
    default:
      return "Unknown";
  }
}

function getWorstGrade(grades: string[]): string {
  const gradeOrder = ["A", "B", "C", "D", "F"];
  let worst = "A";
  for (const g of grades) {
    if (gradeOrder.indexOf(g) > gradeOrder.indexOf(worst)) {
      worst = g;
    }
  }
  return worst;
}

function analyzeSPF(records: string[]): SpfResult {
  const spfRecord = records.find((r) => r.startsWith("v=spf1"));

  if (!spfRecord) {
    return {
      raw: null,
      grade: "F",
      verdict: "No SPF record found",
      mechanisms: [],
    };
  }

  const mechanisms: string[] = [];
  const parts = spfRecord.split(/\s+/);

  let hasAll = false;
  let allMechanism = "";

  for (const part of parts) {
    if (part.startsWith("v=spf1")) continue;
    if (part.startsWith("+all")) {
      hasAll = true;
      allMechanism = "+all";
      mechanisms.push("+all");
    } else if (part.startsWith("-all")) {
      hasAll = true;
      allMechanism = "-all";
      mechanisms.push("-all");
    } else if (part.startsWith("~all")) {
      hasAll = true;
      allMechanism = "~all";
      mechanisms.push("~all");
    } else if (part.startsWith("?all")) {
      hasAll = true;
      allMechanism = "?all";
      mechanisms.push("?all");
    } else if (part.startsWith("include:")) {
      mechanisms.push(part);
    } else if (part.startsWith("ip4:") || part.startsWith("ip6:")) {
      mechanisms.push(part);
    } else if (part.startsWith("a") || part.startsWith("mx") || part.startsWith("ptr")) {
      mechanisms.push(part);
    }
  }

  if (!hasAll) {
    return {
      raw: spfRecord,
      grade: "F",
      verdict: "No 'all' mechanism — policy is not defined",
      mechanisms,
    };
  }

  const includeCount = mechanisms.filter((m) => m.startsWith("include:")).length;

  let grade: string;
  let verdict: string;

  switch (allMechanism) {
    case "-all": {
      if (includeCount <= 2) {
        grade = "A";
        verdict = "Policy set to reject — strong protection with minimal includes";
      } else {
        grade = "B";
        verdict = "Policy set to reject — strong protection with multiple includes";
      }
      break;
    }
    case "~all": {
      grade = "C";
      verdict = "Policy set to softfail — moderate protection";
      break;
    }
    case "?all": {
      grade = "D";
      verdict = "Policy set to neutral — weak protection";
      break;
    }
    case "+all": {
      grade = "F";
      verdict = "Policy allows all — no protection";
      break;
    }
    default: {
      grade = "F";
      verdict = "Unrecognized policy";
    }
  }

  return {
    raw: spfRecord,
    grade,
    verdict,
    mechanisms,
  };
}

async function analyzeDKIM(domain: string): Promise<DkimResult> {
  for (const selector of DKIM_SELECTORS) {
    try {
      const records = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
      const dkimRecord = records.find((r) => {
        const joined = r.join("");
        return joined.includes("v=DKIM1") || joined.startsWith("v=DKIM1");
      });

      if (dkimRecord) {
        return {
          found: true,
          selector,
          raw: dkimRecord.join(""),
          grade: "A",
          verdict: `Valid DKIM record found (selector: ${selector})`,
        };
      }
    } catch {
      // No DKIM record for this selector, try next
    }
  }

  return {
    found: false,
    selector: null,
    raw: null,
    grade: "F",
    verdict: "No DKIM record found for common selectors",
  };
}

function analyzeDMARC(records: string[]): DmarcResult {
  const dmarcRecord = records.find((r) => r.startsWith("v=DMARC1"));

  if (!dmarcRecord) {
    return {
      raw: null,
      grade: "F",
      policy: "none",
      rua: null,
      pct: 100,
      verdict: "No DMARC record found",
    };
  }

  const parts = dmarcRecord.split(";").map((s) => s.trim());
  let policy = "none";
  let rua: string | null = null;
  let pct = 100;

  for (const part of parts) {
    if (part.startsWith("p=")) {
      policy = part.substring(2).trim();
    }
    if (part.startsWith("rua=")) {
      rua = part.substring(4).trim();
    }
    if (part.startsWith("pct=")) {
      pct = parseInt(part.substring(4).trim(), 10);
      if (isNaN(pct)) pct = 100;
    }
  }

  let grade: string;
  let verdict: string;

  switch (policy) {
    case "reject": {
      grade = "A";
      verdict = "Policy set to reject — strong protection";
      break;
    }
    case "quarantine": {
      grade = "B";
      verdict = "Policy set to quarantine — good protection";
      break;
    }
    case "none": {
      grade = "D";
      verdict = "Policy set to none — monitoring only, no enforcement";
      break;
    }
    default: {
      grade = "F";
      verdict = "Unrecognized DMARC policy";
    }
  }

  // Bump grade up one level if rua is present (only for non-A grades)
  if (rua && grade !== "A") {
    const gradeMap: Record<string, string> = { B: "A", C: "B", D: "C", F: "D" };
    if (gradeMap[grade]) {
      grade = gradeMap[grade];
      verdict += " — with reporting address";
    }
  }

  // Lower grade if pct < 100
  if (pct < 100) {
    const gradeMap: Record<string, string> = { A: "B", B: "C", C: "D", D: "F" };
    if (gradeMap[grade]) {
      grade = gradeMap[grade];
      verdict += ` — but only applies to ${pct}% of email`;
    } else {
      verdict += ` — applies to ${pct}% of email`;
    }
  }

  return {
    raw: dmarcRecord,
    grade,
    policy,
    rua,
    pct,
    verdict,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing required parameter: domain" },
      { status: 400 }
    );
  }

  if (!domain.includes(".")) {
    return NextResponse.json(
      { error: "Invalid domain" },
      { status: 400 }
    );
  }

  try {
    // Run SPF and DMARC queries in parallel
    const [txtRecords, dmarcRecords] = await Promise.allSettled([
      dns.resolveTxt(domain).catch(() => [] as string[][]),
      dns.resolveTxt(`_dmarc.${domain}`).catch(() => [] as string[][]),
    ]);

    const txtRecordsList =
      txtRecords.status === "fulfilled"
        ? txtRecords.value.map((r) => r.join(""))
        : [];

    const dmarcRecordsList =
      dmarcRecords.status === "fulfilled"
        ? dmarcRecords.value.map((r) => r.join(""))
        : [];

    const spf = analyzeSPF(txtRecordsList);
    const dkim = await analyzeDKIM(domain);
    const dmarc = analyzeDMARC(dmarcRecordsList);

    const overallGrade = getWorstGrade([spf.grade, dkim.grade, dmarc.grade]);

    const result: EmailSecurityResult = {
      domain,
      spf,
      dkim,
      dmarc,
      overallGrade,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Email security check error:", error);
    return NextResponse.json(
      { error: "Failed to check email security records" },
      { status: 500 }
    );
  }
}