"use client";

import { useMemo, useState, useTransition } from "react";
import type { NormalizedEventInput } from "@/types/events";

type ApiResponse =
  | { ok: true; events: NormalizedEventInput[] }
  | { error?: string };

function formatDate(value?: number) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function NewsPage() {
  const [location, setLocation] = useState("Sacramento, CA");
  const [interest, setInterest] = useState("");
  const [events, setEvents] = useState<NormalizedEventInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => (b.startsAt ?? 0) - (a.startsAt ?? 0));
  }, [events]);

  const runSearch = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/news/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          interest: interest.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok) {
        setError(payload && "error" in payload ? payload.error || "Request failed." : "Request failed.");
        setEvents([]);
        return;
      }

      if (!payload || !("ok" in payload) || !payload.ok) {
        setError("Unexpected response from the server.");
        setEvents([]);
        return;
      }

      setEvents(payload.events ?? []);
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(92,168,255,0.18),_transparent_30%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_40%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-sky-200/80">
                NearbyMe
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Local happenings from NewsAPI
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Type a city + state and we’ll pull recent local coverage, then structure it into
                “event-like” cards. It’s great for discovering festivals, fairs, exhibits, and
                community posts.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="block">
                <span className="sr-only">City, State</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, ST"
                  className="w-full min-w-[240px] rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/30 focus:bg-slate-950/55"
                />
              </label>
              <label className="block">
                <span className="sr-only">Interest (optional)</span>
                <input
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="Interest (optional)"
                  className="w-full min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/30 focus:bg-slate-950/55"
                />
              </label>
              <button
                type="button"
                onClick={runSearch}
                disabled={isPending}
                className="rounded-full bg-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Searching…" : "Search"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Local feed</h2>
              <p className="text-sm text-slate-400">
                Structured from NewsAPI “everything” search for your location
              </p>
            </div>
            <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">
              {sorted.length} items
            </span>
          </div>

          {!sorted.length ? (
            <div className="p-6 text-sm text-slate-400">
              Search a city to see results. Example: <span className="text-white">Austin, TX</span> or{" "}
              <span className="text-white">New York, NY</span>.
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((event) => {
                const when = formatDate(event.startsAt);
                const href = event.sourceUrl;
                return (
                  <article
                    key={event.externalId}
                    className="group flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/7"
                  >
                    {event.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.imageUrl}
                        alt=""
                        className="h-36 w-full object-cover opacity-90 transition group-hover:opacity-100"
                      />
                    ) : (
                      <div className="h-36 w-full bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_transparent_55%),linear-gradient(180deg,_rgba(15,23,42,0.2),_rgba(15,23,42,0.8))]" />
                    )}

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-medium text-slate-200">
                          {event.sourcePlatform || "news"}
                        </span>
                        {when ? (
                          <span className="text-xs text-slate-400">{when}</span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-semibold leading-6 text-white">
                        {event.title || "Untitled"}
                      </h3>

                      {event.description ? (
                        <p className="line-clamp-4 text-sm leading-6 text-slate-300">
                          {event.description}
                        </p>
                      ) : (
                        <p className="text-sm leading-6 text-slate-400">
                          No description available.
                        </p>
                      )}

                      <div className="mt-auto flex flex-col gap-2">
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-300">Where:</span>{" "}
                          {event.venueName || location}
                        </div>

                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                          >
                            Open source
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

