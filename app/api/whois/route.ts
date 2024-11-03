import { NextResponse } from "next/server";
import { lookup } from "whois";
import { promisify } from "util";

const whoisLookup = promisify(lookup);

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const rawResult = await whoisLookup(domain);

    if (!rawResult) {
      return NextResponse.json(
        { error: "No WHOIS data found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      domain,
      whoisData: rawResult,
    });
  } catch (error) {
    console.error("Error processing WHOIS request:", error);
    return NextResponse.json(
      { error: "Failed to fetch WHOIS information" },
      { status: 500 }
    );
  }
}
