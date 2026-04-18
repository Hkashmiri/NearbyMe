import { NextRequest, NextResponse } from "next/server";
import { fetchNewsApiEvents } from "@/lib/socialvault";
import { type DiscoveryInput } from "@/types/events";

function defaultDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<Pick<DiscoveryInput, "location" | "interest" | "startDate" | "endDate">>
    | null;

  const { startDate, endDate } = defaultDates();
  const location = body?.location?.trim() || "Sacramento, CA";
  const interest = body?.interest?.trim();

  try {
    const events = await fetchNewsApiEvents({
      location,
      interest,
      startDate: body?.startDate || startDate,
      endDate: body?.endDate || endDate,
      presetId: "overview",
    });

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch local news." },
      { status: 500 },
    );
  }
}

