"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserMenu } from "@/components/auth-shell";

const TABS = [
  { href: "/?tab=events",  label: "Events",    tab: "events"  },
  { href: "/?tab=news",    label: "Local News", tab: "news"    },
  { href: "/?tab=history", label: "History",    tab: "history" },
] as const;

export function TopTabs() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "events";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/Nearby Me.png"
            alt="Nearby Me logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-lg font-semibold text-slate-100">Nearby Me</span>
        </div>

        <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {TABS.map(({ href, label, tab }) => (
            <Link
              key={tab}
              href={href}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active === tab
                  ? "bg-slate-200/10 text-sky-300 shadow-sm"
                  : "text-sky-300 hover:bg-white/8 hover:text-sky-100",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}