export async function geocodePlace(place: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !place.trim()) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", place);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }>;
  };

  const result = payload.results?.[0];
  const location = result?.geometry?.location;

  if (typeof location?.lat !== "number" || typeof location.lng !== "number") {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: result?.formatted_address,
  };
}
