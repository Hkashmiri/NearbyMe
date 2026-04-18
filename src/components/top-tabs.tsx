"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/auth-shell";

const tabs = [
  { href: "/", label: "Events" },
  { href: "/news", label: "Local News" },
] as const;

export function TopTabs() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-amber-300 text-slate-950 shadow-sm"
                    : "text-slate-200 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}

