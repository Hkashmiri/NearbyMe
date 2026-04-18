"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChatWorkspace } from "@/components/chat-workspace";
import { DiscoveryPanel } from "@/components/discovery-panel";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import { db } from "@/lib/db";
import { type DiscoveryInput, type EventRecord } from "@/types/events";

type TravelInfo = {
  distanceText: string;
  durationText: string;
  error?: string;
};

function sortEvents(events: EventRecord[]) {
  return [...events].sort((left, right) => {
    const leftStartsAt = left.startsAt ?? Number.MAX_SAFE_INTEGER;
    const rightStartsAt = right.startsAt ?? Number.MAX_SAFE_INTEGER;
    return leftStartsAt - rightStartsAt || right.importedAt - left.importedAt;
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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function HomePage() {
  const initialDates = defaultDates();
  const { data, error, isLoading } = db.useQuery({ events: {} });
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelByEventId, setTravelByEventId] = useState<Record<string, TravelInfo>>(
    {},
  );
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [searchOrigin, setSearchOrigin] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [form, setForm] = useState<DiscoveryInput>({
    location: "Sacramento, CA",
    interest: "",
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    presetId: "overview",
  });

  const events = useMemo(() => sortEvents(data?.events ?? []), [data?.events]);
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const effectiveOrigin =
    searchOrigin ?? (deviceLocation ? { ...deviceLocation, label: "Your current location" } : null);

  useEffect(() => {
    if (!selectedEventId && events[0]) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (positionError) => {
        setLocationError(positionError.message);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  const updateForm = (patch: Partial<DiscoveryInput>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleRefresh = () => {
    startRefresh(async () => {
      const response = await fetch("/api/events/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        window.alert(payload?.error ?? "Unable to refresh events.");
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (!deviceLocation) {
      window.alert(locationError ?? "Current location is not available.");
      return;
    }

    setSearchOrigin({
      ...deviceLocation,
      label: "Your current location",
    });
  };

  const locationStatus = effectiveOrigin
    ? `Using ${effectiveOrigin.label} for map travel estimates. Event search still uses "${form.location}".`
    : GOOGLE_MAPS_API_KEY
      ? `Searching events near "${form.location}". Map travel estimates need shared GPS.`
      : `Searching events near "${form.location}". Add a Maps key only if you want map travel estimates.`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,190,92,0.24),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_45%,_#1f2937_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DiscoveryPanel
          form={form}
          onChange={updateForm}
          onUseCurrentLocation={handleUseCurrentLocation}
          onSubmit={handleRefresh}
          isRefreshing={isRefreshing}
          locationStatus={locationStatus}
        />

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
                setTravelByEventId((current) => ({
                  ...current,
                  [eventId]: travelInfo,
                }))
              }
            />
          </div>
        </section>

        <ChatWorkspace eventsCount={events.length} />
      </div>
    </main>
  );
}
