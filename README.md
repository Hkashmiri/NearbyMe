# NearbyMe

NearbyMe is a Next.js app that uses SociaVault, NewsAPI, Gemini, Google Maps, and InstantDB to surface free local events and sync them live across clients.

## What It Does

- Searches for free local events using preset AI prompt styles inspired by "Everyday AI Hacks"
- Supplements the event feed with local-news article discovery from NewsAPI
- Lets users enter a city or state instead of sharing live GPS
- Syncs discovered events into InstantDB in realtime
- Uses Gemini to classify whether events are free, ticketed, or RSVP-based
- Uses Google Maps to show event pins, distance, and drive time from the chosen origin

## Setup

1. Install dependencies with `npm install`.
2. Fill in `.env` using `.env.example`.
3. Push the Instant config:
   - `npx instant-cli push schema`
   - `npx instant-cli push perms`
4. Start the app with `npm run dev`.

## Dev Cache Reset

If Next's dev server throws `ENOENT` errors for files inside `.next/static/development` or `.next/server/app`, clear the dev cache and restart:

1. `npm run clean`
2. `npm run dev`

## Environment Variables

- `NEXT_PUBLIC_INSTANT_APP_ID`: Instant client app id
- `INSTANT_APP_ADMIN_TOKEN`: Instant admin token for server writes
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript and geocoding key
- `GEMINI_API_KEY`: Gemini Developer API key for prompt/query structuring
- `SOCIAVAULT_API_KEY`: SociaVault API key for Google search scraping
- `NEWS_API_KEY`: NewsAPI key for local article-based event discovery

## Notes

- The app uses SociaVault's Google search scraping endpoint as the event discovery source, then structures results into event records for InstantDB.
- If SociaVault or Gemini credentials are unavailable, the UI still works with demo events and fallback inference.
