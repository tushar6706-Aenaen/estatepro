"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { validateEmail, validatePassword } from "@/src/lib/validation";

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
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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

    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password strength for signup
    if (mode === "signup") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message || "Invalid password.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabaseBrowserClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?mode=signin`,
          },
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
          setPendingEmail(null);
          router.push("/onboarding");
        } else {
          setPendingEmail(email);
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { data, error } =
          await supabaseBrowserClient.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setPendingEmail(email);
            setNotice("Confirm your email first. We can resend the link below.");
            return;
          }
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

  const handleResend = async () => {
    if (!pendingEmail) return;
    setError(null);
    setNotice(null);
    setResendBusy(true);

    try {
      const { error } = await supabaseBrowserClient.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?mode=signin`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setNotice("Confirmation email sent. Check your inbox.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to resend email.";
      setError(message);
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="relative max-h-screen overflow-hidden bg-gray-50 text-gray-900">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-gray-200/30 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3 text-sm text-gray-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-800">
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
            <div className="text-xs uppercase tracking-[0.28em] text-gray-500">
              Phase 2
            </div>
            <div className="font-semibold text-gray-900">Authentication & Roles</div>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full">
          
          <form
            onSubmit={handleAuth}
            className="relative space-y-6 rounded-3xl border border-gray-300 bg-white p-8 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 rounded-full bg-gray-100 p-1 text-xs font-semibold text-gray-900">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setPendingEmail(null);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signin"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setPendingEmail(null);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signup"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Create account
                </button>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
              >
                Back home
              </Link>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  <span>Password</span>
                  {mode === "signup" && (
                    <span className="text-xs font-normal text-gray-600">
                      8+ chars, uppercase, lowercase, number
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/40"
                  placeholder="********"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-300/40"
                    placeholder="Repeat password"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            {pendingEmail && (
              <div className="rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-xs text-gray-700">
                <div className="font-semibold text-gray-900">
                  Waiting for confirmation
                </div>
                <div className="mt-1">
                  We sent a confirmation link to {pendingEmail}. If you do not
                  see it, check your spam folder or resend below.
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendBusy}
                  className="mt-3 inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendBusy ? "Sending..." : "Resend confirmation email"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)] transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            
          </form>
        </div>
      </main>
    </div>
  );
}


