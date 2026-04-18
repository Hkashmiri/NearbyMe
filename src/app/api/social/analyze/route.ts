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
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; NearbyMe/1.0)",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
          }

          const html = await response.text();
          const jsonLdEvent = parseEventJsonLd(html);
          if (jsonLdEvent) {
            return jsonLdEvent;
          }

          const pageContext = extractPageContext(html, url);
          const eventInfo = await analyzeUrlContent(pageContext, url);
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

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function parseOpenGraph(html: string) {
  const og: Record<string, string> = {};
  const regex = /<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const [_, name, content] = match;
    og[name.toLowerCase()] = content;
  }

  return og;
}

function parseJsonLd(html: string) {
  const scripts: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed) {
        scripts.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return scripts;
}

function parseEventJsonLd(html: string) {
  const jsonLd = parseJsonLd(html);
  const candidates = jsonLd.flatMap((item) => (Array.isArray(item) ? item : [item]));

  for (const candidate of candidates) {
    if (typeof candidate !== "object" || candidate === null) continue;
    const data = candidate as Record<string, any>;
    const type = data["@type"];
    const types = Array.isArray(type) ? type : [type];

    if (types.includes("Event")) {
      return {
        title: data.name || "Untitled Event",
        description: data.description || "Unknown",
        location:
          typeof data.location === "string"
            ? data.location
            : data.location?.name || data.location?.address || "Unknown",
        date: data.startDate || data.start_date || "Unknown",
        price:
          data.offers?.price || data.offers?.priceSpecification?.price || data.price || "Unknown",
        whatHappens: data.description || "Unknown",
        otherDetails: data.location?.address || data.offers?.availability || "No additional details",
      };
    }
  }

  return null;
}

function extractPageContext(html: string, url: string) {
  const og = parseOpenGraph(html);
  const metadata: string[] = [];

  if (url) {
    metadata.push(`Source URL: ${url}`);
  }

  if (og["og:title"]) {
    metadata.push(`OG Title: ${og["og:title"]}`);
  }
  if (og["og:description"]) {
    metadata.push(`OG Description: ${og["og:description"]}`);
  }
  if (og["og:url"]) {
    metadata.push(`OG URL: ${og["og:url"]}`);
  }
  if (og["og:image"]) {
    metadata.push(`OG Image URL: ${og["og:image"]}`);
  }
  if (og["twitter:title"]) {
    metadata.push(`Twitter Title: ${og["twitter:title"]}`);
  }
  if (og["twitter:description"]) {
    metadata.push(`Twitter Description: ${og["twitter:description"]}`);
  }

  const bodyText = stripHtmlTags(html).slice(0, 10000);
  metadata.push(`Page text preview:\n${bodyText}`);

  return metadata.join("\n\n");
}