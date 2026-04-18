import { type InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";

export type AttendanceType = "free" | "ticket" | "rsvp" | "unknown";

export type AttendanceAnalysis = {
  attendanceType: AttendanceType;
  attendanceHow: string;
  attendanceSummary: string;
};

export type EventRecord = InstaQLEntity<AppSchema, "events">;

export type NormalizedEventInput = {
  externalId: string;
  sourcePlatform: string;
  title: string;
  description?: string;
  rawPostText: string;
  sourceUrl?: string;
  venueName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startsAt?: number;
  endsAt?: number;
  imageUrl?: string;
};

export type DiscoveryPresetId =
  | "overview"
  | "niche"
  | "family"
  | "culture"
  | "nature";

export type DiscoveryPreset = {
  id: DiscoveryPresetId;
  label: string;
  headline: string;
  description: string;
  promptTemplate: string;
};

export type DiscoveryInput = {
  location: string;
  interest?: string;
  startDate?: string;
  endDate?: string;
  presetId: DiscoveryPresetId;
};

export type SociaVaultSearchResult = {
  title?: string;
  link?: string;
  snippet?: string;
  source?: string;
  date?: string;
  position?: number;
};

export type SociaVaultSearchEnvelope =
  | Record<string, unknown>
  | Record<string, unknown>[];

export type NewsApiArticle = {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: {
    id?: string | null;
    name?: string;
  };
};

export type NewsApiEnvelope = {
  articles?: NewsApiArticle[];
};
