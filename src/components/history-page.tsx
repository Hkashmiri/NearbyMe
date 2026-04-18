"use client";

import { useCallback, useEffect, useState } from "react";
import { type DiscoveryInput } from "@/types/events";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number;
  ts: string;
  location: string;
  interest: string;
  startDate: string;
  endDate: string;
  presetId: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("nearbyme_history") ?? "[]");
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  localStorage.setItem("nearbyme_history", JSON.stringify(entries));
}

// ─── Preset meta ─────────────────────────────────────────────────────────────

const PRESET_META: Record<string, { label: string; emoji: string; color: string }> = {
  overview: { label: "Overview",       emoji: "🗺️", color: "bg-amber-400/10 text-amber-300 border-amber-400/25" },
  niche:    { label: "Niche Interest",  emoji: "🎯", color: "bg-sky-400/10 text-sky-300 border-sky-400/25"     },
  family:   { label: "Family Outdoors", emoji: "👨‍👩‍👧", color: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25" },
  culture:  { label: "Culture & Arts",  emoji: "🎨", color: "bg-purple-400/10 text-purple-300 border-purple-400/25" },
  nature:   { label: "Nature Escape",   emoji: "🌿", color: "bg-teal-400/10 text-teal-300 border-teal-400/25"   },
};

function presetMeta(id: string) {
  return PRESET_META[id] ?? { label: id, emoji: "🔍", color: "bg-slate-400/10 text-slate-300 border-slate-400/25" };
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HistoryPageProps {
  onRerun: (form: DiscoveryInput) => void;
}

export function HistoryPage({ onRerun }: HistoryPageProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Load on mount (localStorage is client-only)
  useEffect(() => {
    setEntries(readHistory());
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeHistory(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!window.confirm("Clear all search history?")) return;
    writeHistory([]);
    setEntries([]);
  }, []);

  const handleRerun = useCallback(
    (entry: HistoryEntry) => {
      onRerun({
        location:  entry.location,
        interest:  entry.interest,
        startDate: entry.startDate,
        endDate:   entry.endDate,
        presetId:  entry.presetId,
      });
    },
    [onRerun],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Search History
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {entries.length === 0
              ? "No searches saved yet — run a search on the Events tab to get started."
              : `${entries.length} saved ${entries.length === 1 ? "query" : "queries"} — click Re-run to reload any search.`}
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 rounded-full border border-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-400 transition hover:border-rose-400/60 hover:bg-rose-500/10"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-white/10 bg-slate-950/50 text-slate-500">
          <span className="text-4xl">🗂️</span>
          <p className="text-sm">Your searches will appear here.</p>
        </div>
      )}

      {/* Entry list */}
      {entries.length > 0 && (
        <ul className="flex flex-col gap-3">
          {entries.map((entry, idx) => {
            const meta = presetMeta(entry.presetId);
            return (
              <li
                key={entry.id}
                className="group flex items-center gap-4 rounded-[20px] border border-white/8 bg-slate-950/60 px-5 py-4 transition hover:border-amber-400/20 hover:bg-slate-900/70"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Emoji icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
                  {meta.emoji}
                </div>

                {/* Body */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Location */}
                    <span className="text-sm font-semibold text-white truncate max-w-[220px]">
                      {entry.location || "Unknown location"}
                    </span>
                    {/* Preset badge */}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    {/* Interest badge */}
                    {entry.interest && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
                        {entry.interest}
                      </span>
                    )}
                    {/* Date range badge */}
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
                      {entry.startDate} → {entry.endDate}
                    </span>
                  </div>
                  {/* Timestamp */}
                  <p className="text-[0.7rem] text-slate-600">{formatTs(entry.ts)}</p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRerun(entry)}
                    className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-300"
                  >
                    Re-run
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}