import { demoEvents } from "@/lib/demo-events";
import {
  buildDiscoveryQueries,
  structureNewsArticle,
  structureSearchResult,
} from "@/lib/gemini";
import { getPresetById } from "@/lib/discovery-presets";
import {
  type DiscoveryInput,
  type NewsApiArticle,
  type NewsApiEnvelope,
  type NormalizedEventInput,
  type SociaVaultSearchEnvelope,
  type SociaVaultSearchResult,
} from "@/types/events";

const SOCIAVAULT_GOOGLE_SEARCH_URL =
  "https://api.sociavault.com/v1/scrape/google/search";
const NEWS_API_EVERYTHING_URL = "https://newsapi.org/v2/everything";

function getResults(payload: SociaVaultSearchEnvelope): SociaVaultSearchResult[] {
  if (Array.isArray(payload)) {
    return payload as SociaVaultSearchResult[];
  }

  const candidates = [
    payload.results,
    payload.organic_results,
    payload.data,
    payload.items,
  ];

  const match = candidates.find((candidate) => Array.isArray(candidate));
  return (match as SociaVaultSearchResult[] | undefined) ?? [];
}

function dedupe(results: SociaVaultSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.link || result.title || result.snippet;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchSearchResults(query: string, apiKey: string) {
  const url = new URL(SOCIAVAULT_GOOGLE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SociaVault request failed with ${response.status}`);
  }

  return (await response.json()) as SociaVaultSearchEnvelope;
}

function buildNewsQuery(input: DiscoveryInput) {
  const interest = input.interest?.trim();
  return [
    `"free event" OR festival OR concert OR fair OR exhibit`,
    input.location,
    interest || "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function fetchNewsApiEvents(
  input: DiscoveryInput,
): Promise<NormalizedEventInput[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = new URL(NEWS_API_EVERYTHING_URL);
  url.searchParams.set("q", buildNewsQuery(input));
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "8");
  if (input.startDate) {
    url.searchParams.set("from", input.startDate);
  }
  if (input.endDate) {
    url.searchParams.set("to", input.endDate);
  }

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed with ${response.status}`);
  }

  const payload = (await response.json()) as NewsApiEnvelope;
  const articles = (payload.articles ?? []).filter(
    (article): article is NewsApiArticle => Boolean(article.url || article.title),
  );

  return Promise.all(articles.map((article) => structureNewsArticle(article, input)));
}

export async function fetchSociaVaultEvents(
  input?: Partial<DiscoveryInput>,
): Promise<NormalizedEventInput[]> {
  const apiKey = process.env.SOCIAVAULT_API_KEY;
  const preset = getPresetById(input?.presetId || "overview");

  const discoveryInput: DiscoveryInput = {
    location: input?.location?.trim() || "Sacramento, CA",
    interest: input?.interest?.trim(),
    startDate: input?.startDate,
    endDate: input?.endDate,
    presetId: preset.id,
  };

  if (!apiKey && !process.env.NEWS_API_KEY) {
    return demoEvents;
  }

  const sociaVaultPromise = apiKey
    ? buildDiscoveryQueries(discoveryInput, preset).then((queries) =>
        Promise.all(queries.map((query) => fetchSearchResults(query, apiKey))),
      )
    : Promise.resolve([]);
  const newsApiPromise = fetchNewsApiEvents(discoveryInput);

  const [payloads, newsApiEvents] = await Promise.all([sociaVaultPromise, newsApiPromise]);

  const rawResults = dedupe(payloads.flatMap((payload) => getResults(payload)).slice(0, 10));

  const structuredFromSearch = rawResults.length
    ? await Promise.all(
        rawResults.map((result) => structureSearchResult(result, discoveryInput)),
      )
    : [];

  const combined = dedupeByExternalId([...structuredFromSearch, ...newsApiEvents]);

  if (!combined.length) {
    return demoEvents;
  }

  return combined;
}

function dedupeByExternalId(events: NormalizedEventInput[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.externalId)) {
      return false;
    }
    seen.add(event.externalId);
    return true;
  });
}
