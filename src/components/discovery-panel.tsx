"use client";

import { discoveryPresets } from "@/lib/discovery-presets";
import { type DiscoveryInput, type DiscoveryPresetId } from "@/types/events";

type DiscoveryPanelProps = {
  form: DiscoveryInput;
  onChange: (patch: Partial<DiscoveryInput>) => void;
  onUseCurrentLocation: () => void;
  onSubmit: () => void;
  isRefreshing: boolean;
  locationStatus: string;
};

export function DiscoveryPanel({
  form,
  onChange,
  onUseCurrentLocation,
  onSubmit,
  isRefreshing,
  locationStatus,
}: DiscoveryPanelProps) {
  const activePreset =
    discoveryPresets.find((preset) => preset.id === form.presetId) ?? discoveryPresets[0];

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-amber-200/80">
              Everyday AI Hacks
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              How I Use AI to Find Free Events Wherever I Go
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Use prompt presets to uncover local experiences, quirky festivals, free
              attractions, and neighborhood finds without relying on GPS.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {discoveryPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ presetId: preset.id as DiscoveryPresetId })}
                className={`rounded-[24px] border p-4 text-left transition ${
                  form.presetId === preset.id
                    ? "border-amber-300/70 bg-amber-200/10"
                    : "border-white/10 bg-slate-950/50 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <p className="text-sm font-semibold text-white">{preset.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{preset.headline}</p>
              </button>
            ))}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Active Prompt
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-100">
              {activePreset.promptTemplate}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Search NearbyMe</h2>
              <p className="text-sm text-slate-400">
                Enter a city or state if you do not want to share your live location.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">City or State</span>
              <input
                value={form.location}
                onChange={(event) => onChange({ location: event.target.value })}
                placeholder="Sacramento, CA"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Interest</span>
              <input
                value={form.interest || ""}
                onChange={(event) => onChange({ interest: event.target.value })}
                placeholder="street art, kid-friendly, markets"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Start Date</span>
                <input
                  type="date"
                  value={form.startDate || ""}
                  onChange={(event) => onChange({ startDate: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">End Date</span>
                <input
                  type="date"
                  value={form.endDate || ""}
                  onChange={(event) => onChange({ endDate: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isRefreshing}
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing ? "Searching..." : "Find Free Events"}
              </button>
              <button
                type="button"
                onClick={onUseCurrentLocation}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
              >
                Use My Current Location
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {locationStatus}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
