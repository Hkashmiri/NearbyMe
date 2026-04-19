"use client";

import { useState } from "react";

type EventInfo = {
  title: string;
  description: string;
  location: string;
  date: string;
  price: string;
  whatHappens: string;
  otherDetails: string;
};

export function SocialMediaPanel() {
  const [urls, setUrls] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<EventInfo[]>([]);

  const handleAnalyze = async () => {
    if (!urls.trim()) return;

    setIsAnalyzing(true);
    try {
      const urlList = urls.split("\n").map(u => u.trim()).filter(u => u);
      const response = await fetch("/api/social/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!response.ok) throw new Error("Failed to analyze URLs");

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error analyzing URLs:", error);
      alert("Failed to analyze URLs. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">Social Media Event Discovery</h1>
          <p className="mt-2 text-slate-300">
            Paste URLs from social media posts, event pages, or any web content. AI will analyze them to extract event details like location, date, price, and description.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Works with Instagram posts, Facebook events, X/Twitter threads, YouTube videos, Eventbrite pages, and more.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">URLs (one per line)</span>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={`https://instagram.com/p/example-post
https://facebook.com/events/example-event
https://x.com/username/status/example-tweet
https://youtube.com/watch?v=example-video
https://www.eventbrite.com/e/example-event`}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 min-h-[120px]"
            />
          </label>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !urls.trim()}
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze URLs"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Extracted Events</h2>
            {results.map((event, index) => (
              <div key={index} className="rounded-[24px] border border-white/10 bg-slate-950/50 p-6">
                <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{event.description}</p>
                <div className="mt-4 grid gap-2 text-sm">
                  <p><strong className="text-amber-200">Location:</strong> {event.location}</p>
                  <p><strong className="text-amber-200">Date:</strong> {event.date}</p>
                  <p><strong className="text-amber-200">Price:</strong> {event.price}</p>
                  <p><strong className="text-amber-200">What Happens:</strong> {event.whatHappens}</p>
                  <p><strong className="text-amber-200">Other Details:</strong> {event.otherDetails}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}