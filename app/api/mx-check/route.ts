import { NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

interface MxRecord {
  priority: number;
  exchange: string;
}

interface MxAnalysis {
  hasMxRecords: boolean;
  hasMultipleMx: boolean;
  hasDifferentWeights: boolean;
  onSameDomain: boolean;
  records: MxRecord[];
  details: string[];
  score: number;
  scoreDetails: string[];
}

function isSubdomainOf(mxHost: string, domain: string): boolean {
  mxHost = mxHost.replace(/\.$/, "");
  domain = domain.replace(/\.$/, "");
  return mxHost.endsWith(domain) || mxHost.endsWith(`.${domain}`);
}

function calculateScore(analysis: Omit<MxAnalysis, "score" | "scoreDetails">): {
  score: number;
  scoreDetails: string[];
} {
  let score = 0;
  const scoreDetails: string[] = [];

  // Check if MX records exist (base score: 25)
  if (analysis.hasMxRecords) {
    score += 25;
    scoreDetails.push("✓ MX records exist (+25)");
  } else {
    scoreDetails.push("✗ No MX records found (+0)");
    return { score: 0, scoreDetails: ["No MX records: Score 0"] };
  }

  // Multiple MX records for redundancy (25 points)
  if (analysis.hasMultipleMx) {
    score += 25;
    scoreDetails.push("✓ Multiple MX records provide redundancy (+25)");
  } else {
    scoreDetails.push("✗ Single MX record - no redundancy (+0)");
  }

  // Different priority weights (25 points)
  if (analysis.hasDifferentWeights) {
    score += 25;
    scoreDetails.push("✓ Different priority weights for failover (+25)");
  } else if (analysis.hasMultipleMx) {
    scoreDetails.push(
      "✗ Multiple MX records but no priority differentiation (+0)"
    );
  }

  // Domain management (25 points)
  if (analysis.onSameDomain) {
    score += 25;
    scoreDetails.push("✓ Self-hosted mail servers (+25)");
  } else {
    score += 25;
    scoreDetails.push("✓ Managed by professional email provider (+25)");
  }

  return { score, scoreDetails };
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

    let mxRecords: MxRecord[] = [];
    try {
      mxRecords = await resolveMx(domain);
    } catch (error) {
      console.error("DNS MX lookup error:", error);
    }

    const analysis: Omit<MxAnalysis, "score" | "scoreDetails"> = {
      hasMxRecords: mxRecords.length > 0,
      hasMultipleMx: mxRecords.length >= 2,
      hasDifferentWeights: false,
      onSameDomain: false,
      records: mxRecords,
      details: [],
    };

    // Check for different weights
    const uniquePriorities = new Set(
      mxRecords.map((record) => record.priority)
    );
    analysis.hasDifferentWeights = uniquePriorities.size > 1;

    // Check if MX records are on the same domain
    if (mxRecords.length > 0) {
      const allOnSameDomain = mxRecords.every((record) =>
        isSubdomainOf(record.exchange, domain)
      );
      analysis.onSameDomain = allOnSameDomain;
    }

    // Generate detailed messages
    if (!analysis.hasMxRecords) {
      analysis.details.push("No MX records found");
    } else {
      analysis.details.push(`Found ${mxRecords.length} MX record(s)`);

      if (analysis.hasMultipleMx) {
        analysis.details.push("Multiple MX records provide redundancy");
      } else {
        analysis.details.push(
          "Only one MX record found - no mail server redundancy"
        );
      }

      if (analysis.hasDifferentWeights) {
        analysis.details.push(
          "MX records have different priority weights - good for failover"
        );
      } else if (mxRecords.length > 1) {
        analysis.details.push(
          "Warning: Multiple MX records with same priority - no clear failover order"
        );
      }

      if (analysis.onSameDomain) {
        analysis.details.push(`All MX records are subdomains of ${domain}`);
      } else {
        analysis.details.push(
          `MX records are handled by external mail providers (not on ${domain})`
        );
      }
    }

    // Calculate score
    const { score, scoreDetails } = calculateScore(analysis);

    return NextResponse.json({
      ...analysis,
      score,
      scoreDetails,
    });
  } catch (error) {
    console.error("Error checking MX records:", error);
    return NextResponse.json(
      { error: "Failed to check MX records" },
      { status: 500 }
    );
  }
}
