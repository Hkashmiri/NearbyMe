import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { analyzeAttendance } from "@/lib/gemini";
import { geocodePlace } from "@/lib/places";
import { fetchSociaVaultEvents } from "@/lib/socialvault";
import { type DiscoveryInput } from "@/types/events";
import crypto from "node:crypto";

const UUID_NAMESPACE = "e3c90f25-3c16-4e43-b0bb-01c821a5b9d2";

function uuidV5(name: string, namespace: string) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = crypto.createHash("sha1").update(Buffer.concat([nsBytes, nameBytes])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));

  // Set version (5) and variant (RFC4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
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
    const geocodeCache = new Map<string, { lat: number; lng: number; formattedAddress?: string }>();

    await Promise.all(
      events.map(async (event) => {
        const analysis = await analyzeAttendance(event.rawPostText);
        const recordId = uuidV5(
          `${event.sourcePlatform}:${event.externalId}`,
          UUID_NAMESPACE,
        );

        let latitude = event.latitude;
        let longitude = event.longitude;
        let address = event.address;

        if (
          (typeof latitude !== "number" || typeof longitude !== "number") &&
          (event.address || event.venueName)
        ) {
          const place = (event.address || event.venueName || "").trim();
          if (place) {
            const cached = geocodeCache.get(place);
            const geocode = cached ?? (await geocodePlace(place).catch(() => null));
            if (geocode && !cached) {
              geocodeCache.set(place, geocode);
            }
            if (geocode) {
              latitude = geocode.lat;
              longitude = geocode.lng;
              address = geocode.formattedAddress || address;
            }
          }
        }

        await adminDb.transact(
          adminDb.tx.events[recordId].update({
            externalId: event.externalId,
            sourcePlatform: event.sourcePlatform,
            title: event.title,
            description: event.description,
            rawPostText: event.rawPostText,
            sourceUrl: event.sourceUrl,
            venueName: event.venueName,
            address,
            latitude,
            longitude,
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
