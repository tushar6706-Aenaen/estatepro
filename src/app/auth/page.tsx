"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type Mode = "signin" | "signup";

type ProfileRow = {
  role: "public" | "agent" | "admin" | null;
};

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode: Mode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";
  const redirect = searchParams.get("redirect") ?? "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const ensureProfileRow = async (userId: string) => {
    const { data, error } = await supabaseBrowserClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabaseBrowserClient
        .from("profiles")
        .upsert(
          { id: userId, role: "public" },
          {
            onConflict: "id",
          },
        )
        .select("role")
        .maybeSingle<ProfileRow>();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return inserted?.role ?? "public";
    }

    return data.role ?? "public";
  };

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabaseReady) {
      setError("Supabase environment variables are missing in .env.local.");
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabaseBrowserClient.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        const userId = data.user?.id;
        if (!userId) {
          throw new Error("We could not finish sign-up. Please try again.");
        }

        if (data.session) {
          await ensureProfileRow(userId);
          setNotice("Account created. Let's finish your profile.");
          router.push("/onboarding");
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { data, error } =
          await supabaseBrowserClient.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw new Error(error.message);
        }

        const userId = data.user?.id;
        if (!userId) {
          throw new Error("Sign-in succeeded but no user was returned.");
        }

        const role = await ensureProfileRow(userId);

        const destination =
          redirect ||
          (role === "agent"
            ? "/agent"
            : role === "admin"
              ? "/admin"
              : "/onboarding");

        router.push(destination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-neutral-900/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-neutral-800/30 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3 text-sm text-neutral-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-neutral-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M2 12h20" />
              <path d="m4.9 4.9 14.2 14.2" />
              <path d="m19.1 4.9-14.2 14.2" />
            </svg>
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-neutral-500">
              Phase 2
            </div>
            <div className="font-semibold text-white">Authentication & Roles</div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr,1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-200">
                Secure access
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                Sign in to list homes or track your inquiries.
              </h1>
              <p className="max-w-2xl text-base text-neutral-200/80">
                Use email and password - no magic links required. New accounts
                start as public; switch to agent during onboarding to unlock
                listing tools.
              </p>
              <div className="grid gap-3 text-sm text-neutral-200/80 md:grid-cols-2">
                <FeatureCard title="Email auth" body="Password-based entry built on Supabase Auth." />
                <FeatureCard title="Profile auto-sync" body="We create or update your profile row after sign-in." />
                <FeatureCard title="Role-aware redirects" body="Public users land in onboarding, agents jump to their space." />
                <FeatureCard title="Ready for dashboards" body="Guards are in place for agent/admin-only pages." />
              </div>
              <div className="text-xs text-neutral-400">
                Need help? Check your `.env.local` values for
                `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            </div>
          </div>

          <form
            onSubmit={handleAuth}
            className="relative space-y-6 rounded-3xl border border-white/10 bg-neutral-900/70 p-8 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold text-white">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signin"
                      ? "bg-white text-neutral-900"
                      : "text-neutral-200/80 hover:text-white"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signup"
                      ? "bg-white text-neutral-900"
                      : "text-neutral-200/80 hover:text-white"
                  }`}
                >
                  Create account
                </button>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-neutral-400 transition hover:text-white"
              >
                Back home
              </Link>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-200">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-300/50 focus:ring-2 focus:ring-neutral-400/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-neutral-200">
                  <span>Password</span>
                  <span className="text-xs font-normal text-neutral-400">
                    Minimum 6 characters
                  </span>
                </label>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-300/50 focus:ring-2 focus:ring-neutral-400/40"
                  placeholder="********"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-200">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-300/50 focus:ring-2 focus:ring-neutral-400/40"
                    placeholder="Repeat password"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-400 px-4 py-3 text-sm font-semibold text-neutral-950 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)] transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-neutral-300">
              <div className="font-semibold text-white">What happens next</div>
              <ul className="space-y-1">
                <li>- We keep your session in the browser via Supabase Auth.</li>
                <li>- A profile row is created or updated automatically.</li>
                <li>- Public users are routed to onboarding to pick a role.</li>
              </ul>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.8)]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
        {title}
      </div>
      <div className="mt-2 text-sm text-neutral-200/90">{body}</div>
    </div>
  );
}
