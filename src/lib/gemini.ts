import { GoogleGenAI } from "@google/genai";
import {
  type AttendanceAnalysis,
  type DiscoveryInput,
  type DiscoveryPreset,
  type NewsApiArticle,
  type NormalizedEventInput,
  type SociaVaultSearchResult,
} from "@/types/events";

const model = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

function fallbackAnalysis(rawText: string): AttendanceAnalysis {
  const lower = rawText.toLowerCase();
  const attendanceType = lower.includes("ticket")
    ? "ticket"
    : lower.includes("rsvp")
      ? "rsvp"
      : lower.includes("free")
        ? "free"
        : "unknown";

  return {
    attendanceType,
    attendanceHow:
      attendanceType === "ticket"
        ? "Buy a ticket using the event link or the organizer instructions in the post."
        : attendanceType === "rsvp"
          ? "RSVP using the event link or message the organizer as described in the post."
          : attendanceType === "free"
            ? "Show up at the listed venue and review the post for any entry instructions."
            : "Review the event post and organizer details for attendance instructions.",
    attendanceSummary:
      attendanceType === "ticket"
        ? "Gemini fallback suggests this event likely needs a paid ticket."
        : attendanceType === "rsvp"
          ? "Gemini fallback suggests this event likely needs an RSVP."
          : attendanceType === "free"
            ? "Gemini fallback suggests this event is probably free to attend."
            : "Attendance requirements are unclear from the available post text.",
  };
}

export async function analyzeAttendance(rawText: string): Promise<AttendanceAnalysis> {
  const ai = getClient();
  if (!ai) {
    return fallbackAnalysis(rawText);
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Analyze this event post and return strict JSON with keys:",
                "attendanceType (one of free, ticket, rsvp, unknown),",
                "attendanceHow (plain English instructions),",
                "attendanceSummary (one sentence).",
                "",
                rawText,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackAnalysis(rawText);
    }

    const jsonText = text.replace(/^```json\s*|\s*```$/g, "");
    const parsed = JSON.parse(jsonText) as Partial<AttendanceAnalysis>;

    return {
      attendanceType: parsed.attendanceType ?? "unknown",
      attendanceHow:
        parsed.attendanceHow ??
        "Review the event post and organizer details for attendance instructions.",
      attendanceSummary:
        parsed.attendanceSummary ?? "Attendance requirements are unclear from the post.",
    };
  } catch {
    return fallbackAnalysis(rawText);
  }
}

function fallbackQueries(input: DiscoveryInput, preset: DiscoveryPreset) {
  const dates =
    input.startDate && input.endDate
      ? `${input.startDate} to ${input.endDate}`
      : "this week";
  const interest = input.interest?.trim();
  const base = input.location.trim();

  switch (preset.id) {
    case "niche":
      return [
        `free ${interest || "local hobby"} events in ${base} ${dates}`,
        `site:instagram.com ${interest || "community"} event ${base} free`,
        `site:eventbrite.com free ${interest || "creative"} ${base}`,
      ];
    case "family":
      return [
        `free kid friendly events in ${base} ${dates}`,
        `free museum day story time park events ${base}`,
        `site:facebook.com family events ${base} free`,
      ];
    case "culture":
      return [
        `free outdoor concert art festival ${base} ${dates}`,
        `site:instagram.com art festival concert ${base} free`,
        `site:facebook.com free live music art ${base}`,
      ];
    case "nature":
      return [
        `free trails nature spots near ${base}`,
        `public hiking trails within 30 minutes of ${base}`,
        `regional parks near ${base} free parking`,
      ];
    default:
      return [
        `free local events in ${base} ${dates}`,
        `site:instagram.com free event ${base} ${dates}`,
        `site:facebook.com local events ${base} free`,
      ];
  }
}

export async function buildDiscoveryQueries(
  input: DiscoveryInput,
  preset: DiscoveryPreset,
): Promise<string[]> {
  const ai = getClient();
  if (!ai) {
    return fallbackQueries(input, preset);
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Return strict JSON with a single key named queries.",
                "The value must be an array of 3 short Google search queries for finding free local events.",
                `Prompt style: ${preset.promptTemplate}`,
                `Location: ${input.location}`,
                `Interest: ${input.interest || "none"}`,
                `Start date: ${input.startDate || "not specified"}`,
                `End date: ${input.endDate || "not specified"}`,
                "Favor local calendars, university pages, city pages, arts groups, and grassroots communities.",
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackQueries(input, preset);
    }

    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as {
      queries?: string[];
    };

    return parsed.queries?.filter(Boolean).slice(0, 3) ?? fallbackQueries(input, preset);
  } catch {
    return fallbackQueries(input, preset);
  }
}

export async function structureSearchResult(
  result: SociaVaultSearchResult,
  input: DiscoveryInput,
): Promise<NormalizedEventInput> {
  const rawText = [result.title, result.snippet, result.source].filter(Boolean).join(" ");
  const ai = getClient();

  if (!ai) {
    return {
      externalId: encodeURIComponent(result.link || result.title || rawText),
      sourcePlatform: inferPlatform(result.link),
      title: result.title || "Untitled Event",
      description: result.snippet,
      rawPostText: rawText,
      sourceUrl: result.link,
      venueName: input.location,
      address: input.location,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Return strict JSON with keys:",
                "title, description, venueName, address, startsAt, sourcePlatform.",
                "startsAt should be ISO 8601 or null.",
                "Infer the most likely event details from this search result.",
                `User search location: ${input.location}`,
                `Search result title: ${result.title || ""}`,
                `Search result snippet: ${result.snippet || ""}`,
                `Search result source: ${result.source || ""}`,
                `Search result link: ${result.link || ""}`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    const parsed = text
      ? (JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as {
          title?: string;
          description?: string;
          venueName?: string;
          address?: string;
          startsAt?: string | null;
          sourcePlatform?: string;
        })
      : {};

    return {
      externalId: encodeURIComponent(result.link || result.title || rawText),
      sourcePlatform:
        parsed.sourcePlatform || inferPlatform(result.link) || result.source || "web",
      title: parsed.title || result.title || "Untitled Event",
      description: parsed.description || result.snippet,
      rawPostText: rawText,
      sourceUrl: result.link,
      venueName: parsed.venueName || input.location,
      address: parsed.address || input.location,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt).getTime() : undefined,
    };
  } catch {
    return {
      externalId: encodeURIComponent(result.link || result.title || rawText),
      sourcePlatform: inferPlatform(result.link),
      title: result.title || "Untitled Event",
      description: result.snippet,
      rawPostText: rawText,
      sourceUrl: result.link,
      venueName: input.location,
      address: input.location,
    };
  }
}

export async function structureNewsArticle(
  article: NewsApiArticle,
  input: DiscoveryInput,
): Promise<NormalizedEventInput> {
  const rawText = [article.title, article.description, article.content]
    .filter(Boolean)
    .join(" ");
  const ai = getClient();

  if (!ai) {
    return {
      externalId: encodeURIComponent(article.url || article.title || rawText),
      sourcePlatform: inferPlatform(article.url) || "news",
      title: article.title || "Untitled Event",
      description: article.description,
      rawPostText: rawText,
      sourceUrl: article.url,
      imageUrl: article.urlToImage,
      venueName: input.location,
      address: input.location,
      startsAt: article.publishedAt ? new Date(article.publishedAt).getTime() : undefined,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Return strict JSON with keys:",
                "title, description, venueName, address, startsAt, sourcePlatform.",
                "startsAt should be ISO 8601 or null.",
                "Convert this local-news article into the most likely event record.",
                `User search location: ${input.location}`,
                `Article title: ${article.title || ""}`,
                `Article description: ${article.description || ""}`,
                `Article content: ${article.content || ""}`,
                `Article source: ${article.source?.name || ""}`,
                `Article url: ${article.url || ""}`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    const parsed = text
      ? (JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as {
          title?: string;
          description?: string;
          venueName?: string;
          address?: string;
          startsAt?: string | null;
          sourcePlatform?: string;
        })
      : {};

    return {
      externalId: encodeURIComponent(article.url || article.title || rawText),
      sourcePlatform:
        parsed.sourcePlatform || inferPlatform(article.url) || article.source?.name || "news",
      title: parsed.title || article.title || "Untitled Event",
      description: parsed.description || article.description,
      rawPostText: rawText,
      sourceUrl: article.url,
      imageUrl: article.urlToImage,
      venueName: parsed.venueName || input.location,
      address: parsed.address || input.location,
      startsAt:
        parsed.startsAt
          ? new Date(parsed.startsAt).getTime()
          : article.publishedAt
            ? new Date(article.publishedAt).getTime()
            : undefined,
    };
  } catch {
    return {
      externalId: encodeURIComponent(article.url || article.title || rawText),
      sourcePlatform: inferPlatform(article.url) || "news",
      title: article.title || "Untitled Event",
      description: article.description,
      rawPostText: rawText,
      sourceUrl: article.url,
      imageUrl: article.urlToImage,
      venueName: input.location,
      address: input.location,
      startsAt: article.publishedAt ? new Date(article.publishedAt).getTime() : undefined,
    };
  }
}

function inferPlatform(link?: string) {
  if (!link) {
    return "web";
  }

  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return host.split(".")[0] || "web";
  } catch {
    return "web";
  }
}

export async function analyzeUrlContent(text: string, sourceUrl?: string) {
  const ai = getClient();

  if (!ai) {
    return {
      title: "Untitled Event",
      description: text.slice(0, 200) + "...",
      location: "Unknown",
      date: "Unknown",
      price: "Unknown",
      whatHappens: "Unknown",
      otherDetails: "AI analysis unavailable",
    };
  }

  try {
    let promptText = "Extract event information from this webpage. Return strict JSON with keys: title, description, location, date, price, whatHappens, otherDetails. Be concise and accurate. If information is not available, use 'Unknown'.";

    if (sourceUrl) {
      promptText += `\n\nSource URL: ${sourceUrl}`;
    }

    if (text.trim()) {
      promptText += `\n\nPage content:\n${text.slice(0, 10000)}`;
    } else if (sourceUrl) {
      // If we don't have content but have a URL, ask Gemini to infer from URL structure
      promptText += `\n\nURL: ${sourceUrl}\n\nNote: This appears to be a social media or event URL. Based on the URL structure and common patterns for this platform, extract any event information that might be implied by the URL path, parameters, or known platform conventions.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
    });

    const responseText = response.text?.trim();
    const parsed = responseText
      ? (JSON.parse(responseText.replace(/^```json\s*|\s*```$/g, "")) as {
          title?: string;
          description?: string;
          location?: string;
          date?: string;
          price?: string;
          whatHappens?: string;
          otherDetails?: string;
        })
      : {};

    return {
      title: parsed.title || "Untitled Event",
      description: parsed.description || text.slice(0, 200) + "..." || "No description available",
      location: parsed.location || "Unknown",
      date: parsed.date || "Unknown",
      price: parsed.price || "Unknown",
      whatHappens: parsed.whatHappens || "Unknown",
      otherDetails: parsed.otherDetails || "No additional details",
    };
  } catch (error) {
    console.error("Error analyzing URL content:", error);
    return {
      title: "Error",
      description: "Failed to analyze content",
      location: "Unknown",
      date: "Unknown",
      price: "Unknown",
      whatHappens: "Unknown",
      otherDetails: "Analysis failed",
    };
  }
}
