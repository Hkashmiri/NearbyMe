"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user } = db.useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Loading NearbyMe...
        </div>
      </main>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

export function UserMenu() {
  const { user } = db.useAuth();

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/8"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-white">{user.email || "Signed in"}</p>
        <p className="text-xs text-slate-400">Magic code</p>
      </div>
      <button
        type="button"
        onClick={() => void db.auth.signOut()}
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/8"
      >
        Sign out
      </button>
    </div>
  );
}
