"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DiscoveryPanel } from "@/components/discovery-panel";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import { HistoryPage } from "@/components/history-page";
import { db } from "@/lib/db";
import { type DiscoveryInput, type EventRecord } from "@/types/events";

type TravelInfo = {
  distanceText: string;
  durationText: string;
  error?: string;
};

function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function sortEvents(events: EventRecord[]) {
  return [...events].sort((l, r) => {
    const ls = l.startsAt ?? Number.MAX_SAFE_INTEGER;
    const rs = r.startsAt ?? Number.MAX_SAFE_INTEGER;
    return ls - rs || r.importedAt - l.importedAt;
  });
}

function defaultDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 3);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export interface HistoryEntry {
  id: number;
  ts: string;
  location: string;
  interest: string;
  startDate: string;
  endDate: string;
  presetId: string;
}

function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("nearbyme_history") ?? "[]");
  } catch {
    return [];
  }
}

function saveHistoryEntry(form: DiscoveryInput) {
  const h = readHistory();
  const last = h[0];
  if (
    last &&
    last.location  === form.location  &&
    last.interest  === form.interest  &&
    last.presetId  === form.presetId  &&
    last.startDate === form.startDate &&
    last.endDate   === form.endDate
  ) return;
  h.unshift({
    id:        Date.now(),
    ts:        new Date().toISOString(),
    location:  form.location,
    interest:  form.interest,
    startDate: form.startDate,
    endDate:   form.endDate,
    presetId:  form.presetId,
  });
  if (h.length > 100) h.splice(100);
  localStorage.setItem("nearbyme_history", JSON.stringify(h));
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "events") as "events" | "news" | "history";

  const initialDates = defaultDates();
  const { data, error, isLoading } = db.useQuery({ events: {} });
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelByEventId, setTravelByEventId] = useState<Record<string, TravelInfo>>({});
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchOrigin, setSearchOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [form, setForm] = useState<DiscoveryInput>({
    location:  "Sacramento, CA",
    interest:  "",
    startDate: initialDates.startDate,
    endDate:   initialDates.endDate,
    presetId:  "overview",
  });

  const events = useMemo(() => sortEvents(data?.events ?? []), [data?.events]);
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0] ?? null;
  const effectiveOrigin =
    searchOrigin ?? (deviceLocation ? { ...deviceLocation, label: "Your current location" } : null);

  const closestEvent = useMemo(() => {
    if (!deviceLocation) return null;
    let best: { event: EventRecord; miles: number } | null = null;
    for (const event of events) {
      if (typeof event.latitude !== "number" || typeof event.longitude !== "number") continue;
      const miles = haversineMiles(deviceLocation, { lat: event.latitude, lng: event.longitude });
      if (!best || miles < best.miles) best = { event, miles };
    }
    return best;
  }, [deviceLocation, events]);

  useEffect(() => {
    if (!selectedEventId && events[0]) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  const updateForm = (patch: Partial<DiscoveryInput>) =>
    setForm((cur) => ({ ...cur, ...patch }));

  const handleRefresh = () => {
    saveHistoryEntry(form);
    startRefresh(async () => {
      const response = await fetch("/api/events/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        window.alert(payload?.error ?? "Unable to refresh events.");
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (!deviceLocation) {
      window.alert(locationError ?? "Current location is not available.");
      return;
    }
    setSearchOrigin({ ...deviceLocation, label: "Your current location" });
  };

  const handleRerun = (entry: DiscoveryInput) => {
    setForm(entry);
    router.push("/?tab=events");
  };

  const locationStatus = effectiveOrigin
    ? `Using ${effectiveOrigin.label} for map travel estimates. Event search still uses "${form.location}".`
    : GOOGLE_MAPS_API_KEY
      ? `Searching events near "${form.location}". Map travel estimates need shared GPS.`
      : `Searching events near "${form.location}". Add a Maps key only if you want map travel estimates.`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,190,92,0.24),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_45%,_#1f2937_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">

        {tab === "history" && <HistoryPage onRerun={handleRerun} />}

        {tab === "events" && (
          <>
            <DiscoveryPanel
              form={form}
              onChange={updateForm}
              onUseCurrentLocation={handleUseCurrentLocation}
              onSubmit={handleRefresh}
              isRefreshing={isRefreshing}
              locationStatus={locationStatus}
            />

            {closestEvent ? (
              <button
                type="button"
                onClick={() => setSelectedEventId(closestEvent.event.id)}
                className="group flex items-center justify-between gap-4 rounded-[22px] border border-sky-300/25 bg-sky-300/10 px-5 py-4 text-left transition hover:border-sky-200/35 hover:bg-sky-300/15"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.32em] text-sky-200/80">
                    Closest to you
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {closestEvent.event.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-100">
                    {closestEvent.miles < 0.1 ? "< 0.1" : closestEvent.miles.toFixed(1)} mi
                  </span>
                  <span className="text-sm text-sky-100/80 transition group-hover:text-sky-50">
                    View →
                  </span>
                </div>
              </button>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="order-2 flex min-h-[60vh] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 xl:order-1">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Event Feed</h2>
                    <p className="text-sm text-slate-400">
                      Realtime cards from InstantDB, sourced through SociaVault and Gemini
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {events.length} events
                  </span>
                </div>
                {isLoading ? (
                  <div className="flex flex-1 items-center justify-center px-6 text-sm text-slate-400">
                    Loading events...
                  </div>
                ) : error ? (
                  <div className="flex flex-1 items-center justify-center px-6 text-sm text-rose-300">
                    {error.message}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isSelected={event.id === selectedEvent?.id}
                        onSelect={() => setSelectedEventId(event.id)}
                        travelInfo={travelByEventId[event.id]}
                      />
                    ))}
                    {!events.length ? (
                      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 p-6 text-sm text-slate-400">
                        No events yet. Run a search above to query SociaVault with one of the
                        AI prompt styles and sync results into InstantDB.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="order-1 min-h-[60vh] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 xl:order-2">
                <EventMap
                  events={events}
                  selectedEventId={selectedEvent?.id ?? null}
                  origin={effectiveOrigin}
                  onSelectEvent={setSelectedEventId}
                  onTravelInfoChange={(eventId, travelInfo) =>
                    setTravelByEventId((cur) => ({ ...cur, [eventId]: travelInfo }))
                  }
                />
              </div>
            </section>
          </>
        )}

        {tab === "news" && (
          <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/70 text-slate-400">
            Local News coming soon...
          </div>
        )}
      </div>
    </main>
  );
}