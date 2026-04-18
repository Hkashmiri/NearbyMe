"use client";

import { type EventRecord } from "@/types/events";

type EventCardProps = {
  event: EventRecord;
  isSelected: boolean;
  onSelect: () => void;
  travelInfo?: {
    distanceText: string;
    durationText: string;
    error?: string;
  };
};

function formatAttendance(type?: string | null) {
  switch (type) {
    case "free":
      return "Free";
    case "ticket":
      return "Ticket";
    case "rsvp":
      return "RSVP";
    default:
      return "Unknown";
  }
}

function formatDate(value?: number | null) {
  if (!value) {
    return "Date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function EventCard({
  event,
  isSelected,
  onSelect,
  travelInfo,
}: EventCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[24px] border p-5 text-left transition ${
        isSelected
          ? "border-amber-300/70 bg-amber-200/10 shadow-lg shadow-amber-950/20"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-400/12 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-200">
              {event.sourcePlatform}
            </span>
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-300">
              {formatAttendance(event.attendanceType)}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-white">{event.title}</h3>
        </div>
        <span className="text-sm text-slate-400">{formatDate(event.startsAt)}</span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
        {event.description || event.rawPostText || "No description provided."}
      </p>

      <div className="mt-4 grid gap-3 rounded-[20px] border border-white/8 bg-slate-900/80 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Gemini Summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {event.attendanceSummary || "Analysis pending."}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            How To Attend
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {event.attendanceHow || "Review the source post for attendance details."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>{event.venueName || event.address || "Location TBD"}</span>
        {travelInfo?.error ? (
          <span className="rounded-full bg-rose-400/12 px-3 py-1 text-rose-200">
            {travelInfo.error}
          </span>
        ) : travelInfo ? (
          <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-emerald-200">
            {travelInfo.distanceText} away • {travelInfo.durationText}
          </span>
        ) : null}
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(eventClick) => eventClick.stopPropagation()}
            className="rounded-full border border-white/10 px-3 py-1 text-slate-100 transition hover:border-white/20 hover:bg-white/8"
          >
            View source
          </a>
        ) : null}
      </div>
    </button>
  );
}
