import { NextResponse } from "next/server";
import { validateDomain } from "domain-tld-validator";

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const isValid = validateDomain(domain);
    const score = isValid ? 100 : 0;
    const message = isValid ? "Valid domain format" : "Invalid domain format";

    return NextResponse.json({
      domain,
      isValid,
      score,
      message,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to validate domain, " + error },
      { status: 500 }
    );
  }
}
