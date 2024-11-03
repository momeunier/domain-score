import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { whoisData } = await request.json();

    if (!whoisData) {
      return NextResponse.json(
        { error: "WHOIS data is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a WHOIS data parser. Extract the expiration date from the WHOIS data and return it in the following JSON format:
          {
            "expiry": "YYYY-MM-DD"
          }
          If no valid expiration date is found, return { "expiry": null }.
          Only return this JSON object, nothing else.`,
        },
        {
          role: "user",
          content: whoisData,
        },
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    // Parse the response and ensure it matches our expected format
    let response;
    try {
      response = JSON.parse(
        completion.choices[0].message.content || '{"expiry": null}'
      );

      // Validate the date format if it exists
      if (response.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(response.expiry)) {
        throw new Error("Invalid date format");
      }
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      response = { expiry: null };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing OpenAI request:", error);
    return NextResponse.json({ expiry: null }, { status: 500 });
  }
}
