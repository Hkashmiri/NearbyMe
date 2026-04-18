"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-browser";
import { type EventRecord } from "@/types/events";

type EventMapProps = {
  events: EventRecord[];
  selectedEventId: string | null;
  origin: { lat: number; lng: number; label: string } | null;
  onSelectEvent: (eventId: string) => void;
  onTravelInfoChange: (
    eventId: string,
    travelInfo: { distanceText: string; durationText: string; error?: string },
  ) => void;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function EventMap({
  events,
  selectedEventId,
  origin,
  onSelectEvent,
  onTravelInfoChange,
}: EventMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const distanceServiceRef = useRef<google.maps.DistanceMatrixService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.");
      return;
    }

    let mounted = true;

    async function loadMap() {
      try {
        const mapsApiKey = GOOGLE_MAPS_API_KEY;
        if (!mapsApiKey) {
          return;
        }

        const maps = await loadGoogleMaps(mapsApiKey);

        if (!mounted || !mapRef.current || mapInstanceRef.current) {
          return;
        }

        mapInstanceRef.current = new maps.Map(mapRef.current, {
          center: origin ?? { lat: 38.5816, lng: -121.4944 },
          disableDefaultUI: true,
          zoom: 11,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#0f172a" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#1e293b" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#082f49" }],
            },
          ],
        });

        distanceServiceRef.current = new maps.DistanceMatrixService();
        originMarkerRef.current = new maps.Marker({
          map: mapInstanceRef.current,
          position: origin ?? { lat: 38.5816, lng: -121.4944 },
          title: origin?.label ?? "Origin",
          label: "You",
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load Google Maps.",
        );
      }
    }

    void loadMap();

    return () => {
      mounted = false;
    };
  }, [origin]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    const bounds = new google.maps.LatLngBounds();

    if (origin) {
      bounds.extend(origin);
      originMarkerRef.current?.setPosition(origin);
      originMarkerRef.current?.setTitle(origin.label);
      map.setCenter(origin);
    }

    const plottedEvents = events.filter(
      (event) => typeof event.latitude === "number" && typeof event.longitude === "number",
    );

    plottedEvents.forEach((event) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: event.latitude!, lng: event.longitude! },
        title: event.title,
      });

      marker.addListener("click", () => onSelectEvent(event.id));
      markersRef.current.set(event.id, marker);
      bounds.extend({ lat: event.latitude!, lng: event.longitude! });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 80);
    }
  }, [events, onSelectEvent, origin]);

  useEffect(() => {
    if (!selectedEventId || !origin || !distanceServiceRef.current) {
      return;
    }

    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (
      !selectedEvent ||
      typeof selectedEvent.latitude !== "number" ||
      typeof selectedEvent.longitude !== "number"
    ) {
      return;
    }

    const marker = markersRef.current.get(selectedEvent.id);
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: selectedEvent.latitude,
        lng: selectedEvent.longitude,
      });
      mapInstanceRef.current.setZoom(13);
    }

    distanceServiceRef.current.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [{ lat: selectedEvent.latitude, lng: selectedEvent.longitude }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        if (status !== "OK" || !response?.rows[0]?.elements[0]) {
          onTravelInfoChange(selectedEvent.id, {
            distanceText: "",
            durationText: "",
            error: "Travel estimate unavailable",
          });
          return;
        }

        const element = response.rows[0].elements[0];
        if (element.status !== "OK" || !element.distance || !element.duration) {
          onTravelInfoChange(selectedEvent.id, {
            distanceText: "",
            durationText: "",
            error: "Travel estimate unavailable",
          });
          return;
        }

        onTravelInfoChange(selectedEvent.id, {
          distanceText: element.distance.text,
          durationText: element.duration.text,
        });
      },
    );
  }, [events, onTravelInfoChange, origin, selectedEventId]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Map View</h2>
          <p className="text-sm text-slate-400">
            Distance and travel time from your chosen search origin
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {selectedEvent ? selectedEvent.title : "Select an event"}
        </span>
      </div>
      <div className="relative flex-1">
        <div ref={mapRef} className="absolute inset-0" />
        <div className="absolute inset-x-4 top-4 rounded-[20px] border border-white/10 bg-slate-950/80 p-4 backdrop-blur">
          <p className="text-sm text-slate-200">
            {error
              ? error
              : origin
                ? `Travel origin:`
                : "Enter a city or state, or enable location access to calculate travel times."}
          </p>
          {selectedEvent ? (
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              {selectedEvent.venueName || selectedEvent.address || "Location TBD"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
