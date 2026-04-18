import { NextRequest, NextResponse } from "next/server";
import { geocodePlace } from "@/lib/places";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { place?: string } | null;
  const place = body?.place?.trim();

  if (!place) {
    return NextResponse.json({ error: "Place is required." }, { status: 400 });
  }

  const result = await geocodePlace(place);
  if (!result) {
    return NextResponse.json({ error: "Unable to geocode this place." }, { status: 404 });
  }

  return NextResponse.json(result);
}
