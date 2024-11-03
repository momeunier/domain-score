import { NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);

interface EmailSecurityAnalysis {
  spf: {
    exists: boolean;
    record: string | null;
    details: string[];
    score: number;
    scoreDetails: string[];
  };
  dmarc: {
    exists: boolean;
    record: string | null;
    details: string[];
    score: number;
    scoreDetails: string[];
  };
  totalScore: number;
}

async function getDmarcRecord(domain: string): Promise<string | null> {
  try {
    // DMARC records are stored at _dmarc.domain.com
    const records = await resolveTxt(`_dmarc.${domain}`);
    // DNS TXT records are returned as arrays of strings, we need to join them
    return records[0].join("");
  } catch (error) {
    console.error("Error checking DMARC record:", error);
    return null;
  }
}

async function getSPFRecord(domain: string): Promise<string | null> {
  try {
    const records = await resolveTxt(domain);
    // Find the record that starts with "v=spf1"
    const spfRecord = records.find((record) =>
      record[0].toLowerCase().startsWith("v=spf1")
    );
    return spfRecord ? spfRecord.join("") : null;
  } catch (error) {
    console.error("Error checking SPF record:", error);
    return null;
  }
}

function analyzeSPF(record: string | null): {
  details: string[];
  score: number;
  scoreDetails: string[];
} {
  const details: string[] = [];
  const scoreDetails: string[] = [];
  let score = 0;

  if (!record) {
    details.push(
      "No SPF record found - This may lead to emails being marked as spam"
    );
    scoreDetails.push("✗ No SPF record configured (+0)");
    return { details, score, scoreDetails };
  }

  // Base points for having SPF
  score += 25;
  details.push("SPF record found");
  scoreDetails.push("✓ SPF record exists (+25)");

  // Policy strength scoring
  if (record.includes("-all")) {
    score += 25;
    details.push("Strict SPF policy (hard fail) - Good for security");
    scoreDetails.push("✓ Strict policy configured (+25)");
  } else if (record.includes("~all")) {
    score += 15;
    details.push("Moderate SPF policy (soft fail)");
    scoreDetails.push("~ Moderate policy configured (+15)");
  } else if (record.includes("?all")) {
    score += 5;
    details.push("Neutral SPF policy - Consider stricter settings");
    scoreDetails.push("! Neutral policy configured (+5)");
  } else if (record.includes("+all")) {
    details.push(
      "WARNING: Permissive SPF policy - Not recommended for security"
    );
    scoreDetails.push("✗ Permissive policy - security risk (+0)");
  }

  return { details, score, scoreDetails };
}

function analyzeDMARC(record: string | null): {
  details: string[];
  score: number;
  scoreDetails: string[];
} {
  const details: string[] = [];
  const scoreDetails: string[] = [];
  let score = 0;

  if (!record) {
    details.push("No DMARC record found - Email authentication is incomplete");
    scoreDetails.push("✗ No DMARC record configured (+0)");
    return { details, score, scoreDetails };
  }

  // Base points for having DMARC
  score += 25;
  details.push("DMARC record found");
  scoreDetails.push("✓ DMARC record exists (+25)");

  // Parse policy
  const pMatch = record.match(/p=(\w+)/);
  if (pMatch) {
    switch (pMatch[1].toLowerCase()) {
      case "reject":
        score += 25;
        details.push(
          "Reject policy - Strong protection against email spoofing"
        );
        scoreDetails.push("✓ Strict reject policy (+25)");
        break;
      case "quarantine":
        score += 15;
        details.push(
          "Quarantine policy - Suspicious emails will be quarantined"
        );
        scoreDetails.push("~ Quarantine policy (+15)");
        break;
      case "none":
        score += 5;
        details.push("Monitor-only policy - Consider stricter settings");
        scoreDetails.push("! Monitor-only policy (+5)");
        break;
    }
  }

  // Reporting configuration
  if (record.includes("rua=")) {
    score += 12.5;
    details.push("Aggregate reporting is configured");
    scoreDetails.push("✓ Aggregate reporting configured (+12.5)");
  }
  if (record.includes("ruf=")) {
    score += 12.5;
    details.push("Forensic reporting is configured");
    scoreDetails.push("✓ Forensic reporting configured (+12.5)");
  }

  return { details, score, scoreDetails };
}

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const spfRecord = await getSPFRecord(domain);
    const dmarcRecord = await getDmarcRecord(domain);

    const spfAnalysis = analyzeSPF(spfRecord);
    const dmarcAnalysis = analyzeDMARC(dmarcRecord);

    const analysis: EmailSecurityAnalysis = {
      spf: {
        exists: !!spfRecord,
        record: spfRecord,
        details: spfAnalysis.details,
        score: spfAnalysis.score,
        scoreDetails: spfAnalysis.scoreDetails,
      },
      dmarc: {
        exists: !!dmarcRecord,
        record: dmarcRecord,
        details: dmarcAnalysis.details,
        score: dmarcAnalysis.score,
        scoreDetails: dmarcAnalysis.scoreDetails,
      },
      totalScore: Math.round((spfAnalysis.score + dmarcAnalysis.score) / 2),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error checking email security records:", error);
    return NextResponse.json(
      { error: "Failed to check email security records" },
      { status: 500 }
    );
  }
}
