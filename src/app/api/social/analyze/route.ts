import { NextRequest, NextResponse } from "next/server";
import { analyzeUrlContent } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { urls }: { urls: string[] } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array is required" }, { status: 400 });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const eventInfo = await analyzeUrlContent("", url);
          return eventInfo;
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error);
          return {
            title: "Error",
            description: `Failed to analyze ${url}`,
            location: "Unknown",
            date: "Unknown",
            price: "Unknown",
            whatHappens: "Unknown",
            otherDetails: "Error occurred",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in social analyze API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}