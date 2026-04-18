let googleMapsPromise: Promise<typeof google.maps> | null = null;

export async function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only load in the browser.");
  }

  if (window.google?.maps) {
    return window.google.maps;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-google-maps="true"]',
      ) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.google.maps));
        existingScript.addEventListener("error", () =>
          reject(new Error("Unable to load Google Maps.")),
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error("Unable to load Google Maps."));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
