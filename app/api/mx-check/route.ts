import { NextResponse } from "next/server";
import { getMXRecords } from "@/app/utils/dns";
import { MxAnalysisData } from "@/app/types";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();
    const records = await getMXRecords(domain);

    const hasMxRecords = records.length > 0;
    const hasMultipleMx = records.length > 1;
    const hasDifferentWeights =
      new Set(records.map((r) => r.priority)).size > 1;

    const exchanges = records.map((r) => r.exchange.toLowerCase());
    const baseDomain = domain.toLowerCase();
    const onSameDomain = exchanges.every(
      (exchange) => exchange.endsWith(baseDomain) || exchange === baseDomain
    );

    const score = calculateMxScore(
      hasMxRecords,
      hasMultipleMx,
      hasDifferentWeights,
      onSameDomain
    );
    const scoreDetails = generateScoreDetails(
      hasMxRecords,
      hasMultipleMx,
      hasDifferentWeights,
      onSameDomain
    );

    const response: MxAnalysisData = {
      hasMxRecords,
      hasMultipleMx,
      hasDifferentWeights,
      onSameDomain,
      records,
      score,
      scoreDetails,
      details: [], // Add if needed
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("MX check error:", error);
    return NextResponse.json(
      {
        hasMxRecords: false,
        hasMultipleMx: false,
        hasDifferentWeights: false,
        onSameDomain: false,
        records: [],
        score: 0,
        scoreDetails: ["Failed to check MX records"],
        details: ["Error occurred while checking MX records"],
      } as MxAnalysisData,
      { status: 500 }
    );
  }
}

function calculateMxScore(
  hasMxRecords: boolean,
  hasMultipleMx: boolean,
  hasDifferentWeights: boolean,
  onSameDomain: boolean
): number {
  let score = 0;
  if (hasMxRecords) score += 40;
  if (hasMultipleMx) score += 20;
  if (hasDifferentWeights) score += 20;
  if (!onSameDomain) score += 20;
  return score;
}

function generateScoreDetails(
  hasMxRecords: boolean,
  hasMultipleMx: boolean,
  hasDifferentWeights: boolean,
  onSameDomain: boolean
): string[] {
  const details = [];
  if (hasMxRecords) {
    details.push("Has MX records (+40 points)");
  } else {
    details.push("No MX records found (+0 points)");
  }
  if (hasMultipleMx) {
    details.push("Multiple MX records for redundancy (+20 points)");
  }
  if (hasDifferentWeights) {
    details.push("Different priorities for failover (+20 points)");
  }
  if (!onSameDomain) {
    details.push(
      "MX records on different domains for better reliability (+20 points)"
    );
  }
  return details;
}
