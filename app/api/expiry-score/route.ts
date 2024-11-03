import { NextResponse } from "next/server";

interface ExpiryInput {
  expiry: string | null;
}

function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateScore(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 1) return 0;
  if (daysUntilExpiry <= 7) return 25;
  if (daysUntilExpiry <= 30) return 50;
  if (daysUntilExpiry <= 180) return 75;
  return 100;
}

export async function POST(request: Request) {
  try {
    const body: ExpiryInput = await request.json();

    if (!body.expiry) {
      return NextResponse.json(
        {
          score: 0,
          message: "No expiry date provided",
          daysUntilExpiry: null,
        },
        { status: 400 }
      );
    }

    const daysUntilExpiry = calculateDaysUntilExpiry(body.expiry);
    const score = calculateScore(daysUntilExpiry);

    let message = "";
    if (score === 100) message = "Domain expiry is healthy (>6 months)";
    else if (score === 75) message = "Domain expires in less than 6 months";
    else if (score === 50) message = "Domain expires in less than 1 month";
    else if (score === 25) message = "Domain expires in less than 1 week";
    else message = "Domain expires in less than 1 day";

    return NextResponse.json({
      score,
      message,
      daysUntilExpiry,
    });
  } catch (error) {
    console.error("Error calculating expiry score:", error);
    return NextResponse.json(
      {
        score: 0,
        message: "Failed to calculate expiry score",
        daysUntilExpiry: null,
      },
      { status: 500 }
    );
  }
}
