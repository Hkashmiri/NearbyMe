import { type DiscoveryPreset } from "@/types/events";

export const discoveryPresets: DiscoveryPreset[] = [
  {
    id: "overview",
    label: "Overview",
    headline: "Get the lay of the land",
    description:
      "Pull free local events for a short trip window and bias toward what locals actually attend.",
    promptTemplate:
      "I’m in [city] for the next three days. List five free local events happening between [dates]. Focus on things locals would actually do, not tourist attractions.",
  },
  {
    id: "niche",
    label: "Niche Interest",
    headline: "Tailor discovery to your thing",
    description:
      "Find odd, specific, hobby-driven events and include the sites or social handles behind them.",
    promptTemplate:
      "Find three unique, free events in [city] related to [specific hobby]. Include any websites or social media handles.",
  },
  {
    id: "family",
    label: "Family Outdoors",
    headline: "Practical and kid-friendly",
    description:
      "Search for parks, story times, free museum days, and other low-friction family activities.",
    promptTemplate:
      "Looking for free, kid-friendly activities near [neighborhood]. Give me three options like parks, story times, or free museum days. Include the best hours to go to avoid crowds.",
  },
  {
    id: "culture",
    label: "Culture & Arts",
    headline: "Tap into the city’s vibe",
    description:
      "Surface outdoor concerts, art festivals, and cultural events with time and place attached.",
    promptTemplate:
      "What free outdoor concerts or art festivals are happening in [city] this weekend? Include the location, time, and type of music/art.",
  },
  {
    id: "nature",
    label: "Nature Escape",
    headline: "Find air and open space",
    description:
      "Look for natural spots within a short drive, including parking and difficulty notes.",
    promptTemplate:
      "Find three free public trails or natural spots within 30 minutes of [city]. Include parking, difficulty, and any highlights.",
  },
];

export function getPresetById(id: string) {
  return discoveryPresets.find((preset) => preset.id === id) ?? discoveryPresets[0];
}
