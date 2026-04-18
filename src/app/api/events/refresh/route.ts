import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { analyzeAttendance } from "@/lib/gemini";
import { fetchSociaVaultEvents } from "@/lib/socialvault";
import { type DiscoveryInput } from "@/types/events";

function toRecordId(value: string) {
  return Buffer.from(value).toString("base64url");
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_INSTANT_APP_ID || !process.env.INSTANT_APP_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Missing InstantDB environment variables." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Partial<DiscoveryInput> | null;

  try {
    const events = await fetchSociaVaultEvents(body ?? undefined);
    const now = Date.now();

    await Promise.all(
      events.map(async (event) => {
        const analysis = await analyzeAttendance(event.rawPostText);
        const recordId = toRecordId(`${event.sourcePlatform}:${event.externalId}`);

        await adminDb.transact(
          adminDb.tx.events[recordId].update({
            externalId: event.externalId,
            sourcePlatform: event.sourcePlatform,
            title: event.title,
            description: event.description,
            rawPostText: event.rawPostText,
            sourceUrl: event.sourceUrl,
            venueName: event.venueName,
            address: event.address,
            latitude: event.latitude,
            longitude: event.longitude,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            imageUrl: event.imageUrl,
            attendanceType: analysis.attendanceType,
            attendanceHow: analysis.attendanceHow,
            attendanceSummary: analysis.attendanceSummary,
            importedAt: now,
            updatedAt: now,
          }),
        );
      }),
    );

    return NextResponse.json({ ok: true, imported: events.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to refresh events.",
      },
      { status: 500 },
    );
  }
}
