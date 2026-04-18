import { type NormalizedEventInput } from "@/types/events";

const now = Date.now();

export const demoEvents: NormalizedEventInput[] = [
  {
    externalId: "demo-midtown-market",
    sourcePlatform: "instagram",
    title: "Midtown Night Market",
    description:
      "Food stalls, local makers, and live DJs taking over the blocks around Midtown on Friday night.",
    rawPostText:
      "Midtown Night Market returns Friday 6pm-10pm. Free entry. RSVP encouraged through the link in bio.",
    sourceUrl: "https://example.com/midtown-night-market",
    venueName: "Midtown Sacramento",
    address: "1800 L St, Sacramento, CA",
    latitude: 38.575764,
    longitude: -121.485489,
    startsAt: now + 1000 * 60 * 60 * 24,
  },
  {
    externalId: "demo-warehouse-show",
    sourcePlatform: "tiktok",
    title: "Warehouse Indie Show",
    description:
      "Three local bands, projection visuals, and late-night food popups in an arts district warehouse.",
    rawPostText:
      "Saturday doors at 7. Tickets $12 online, $15 at the door. 21+ event. DM for ticket link.",
    sourceUrl: "https://example.com/warehouse-indie-show",
    venueName: "R Street Arts Warehouse",
    address: "1021 R St, Sacramento, CA",
    latitude: 38.570942,
    longitude: -121.493243,
    startsAt: now + 1000 * 60 * 60 * 48,
  },
  {
    externalId: "demo-river-run-club",
    sourcePlatform: "facebook",
    title: "Sunrise River Run Club",
    description:
      "Casual community run with coffee after the route wraps along the river trail.",
    rawPostText:
      "Meet at 6:15am Sunday. Free community run. No ticket needed, just RSVP in the Facebook event if you can make it.",
    sourceUrl: "https://example.com/sunrise-river-run",
    venueName: "Discovery Park Trailhead",
    address: "1600 Garden Hwy, Sacramento, CA",
    latitude: 38.606037,
    longitude: -121.51156,
    startsAt: now + 1000 * 60 * 60 * 72,
  },
];
