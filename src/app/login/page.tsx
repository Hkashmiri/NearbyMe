"use client";

import { db } from "@/lib/db";
import { useMemo, useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const sendCode = async () => {
    setError(null);
    setIsBusy(true);
    try {
      await db.auth.sendMagicCode({ email: normalizedEmail });
      setStep("code");
    } catch (err) {
      const message =
        err && typeof err === "object" && "body" in err
          ? // @ts-expect-error Instant errors may include a body.message
            (err.body?.message as string | undefined)
          : undefined;
      setError(message || "Unable to send a code. Please try again.");
      setStep("email");
    } finally {
      setIsBusy(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    setIsBusy(true);
    try {
      await db.auth.signInWithMagicCode({ email: normalizedEmail, code: code.trim() });
    } catch (err) {
      const message =
        err && typeof err === "object" && "body" in err
          ? // @ts-expect-error Instant errors may include a body.message
            (err.body?.message as string | undefined)
          : undefined;
      setError(message || "That code didn’t work. Double-check it and try again.");
      setCode("");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,190,92,0.24),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_45%,_#1f2937_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-amber-200/80">
              NearbyMe
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
              Find free local events and keep them in your own synced chats.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Sign in with an email code to save multiple chat threads, start new
              chats, and remove old ones. Event discovery still runs through
              SociaVault, NewsAPI, Gemini, and InstantDB.
            </p>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/75 p-8">
            <h2 className="text-2xl font-semibold text-white">
              {step === "email" ? "Login" : "Check your email"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step === "email"
                ? "Enter your email and we’ll send a 6‑digit code. We’ll create an account if you don’t already have one."
                : "Paste the 6‑digit code we sent to your inbox. (It can take a minute.)"}
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {step === "email" ? (
              <form
                className="mt-8 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!normalizedEmail) return;
                  void sendCode();
                }}
              >
                <label className="block">
                  <span className="sr-only">Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-amber-200/30 focus:bg-white/7"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isBusy ? "Sending…" : "Send code"}
                </button>
              </form>
            ) : (
              <form
                className="mt-8 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!code.trim()) return;
                  void verifyCode();
                }}
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  Sending to <span className="font-semibold text-white">{normalizedEmail}</span>
                </div>
                <label className="block">
                  <span className="sr-only">Verification code</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-amber-200/30 focus:bg-white/7"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isBusy ? "Verifying…" : "Verify code"}
                </button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setError(null);
                      setCode("");
                      setStep("email");
                    }}
                    className="text-left text-sm text-slate-300 underline decoration-white/20 underline-offset-4 transition hover:text-white"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void sendCode()}
                    className="text-left text-sm text-slate-300 underline decoration-white/20 underline-offset-4 transition hover:text-white sm:text-right"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
