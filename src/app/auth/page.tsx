"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
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

  const isSignUp = mode === "signup";
  const panelTitle = isSignUp ? "Create your account" : "Welcome back";
  const panelSubtitle = isSignUp
    ? "Set up your account to start listing, messaging agents, and managing your property journey."
    : "Sign in to continue your listings, messages, and onboarding progress.";
  const roleRoutingNote = redirect
    ? `After sign-in, you'll continue to: ${redirect}`
    : "After sign-in, you'll be routed based on your role (admin, agent, or member).";
  const emailInputId = "auth-email";
  const passwordInputId = "auth-password";
  const confirmPasswordInputId = "auth-confirm-password";
  const passwordRulesId = "auth-password-rules";
  const authErrorId = "auth-form-error";
  const authNoticeId = "auth-form-notice";
  const authPendingId = "auth-pending-email";

  return (
    <div className={editorialPageRootClass}>
      <EditorialBackdrop className="absolute inset-y-0" gridClassName="opacity-[0.07]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-8 md:px-6 md:py-12">
        <EditorialCard
          radius="xl"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white/80 px-4 py-3 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.35)] md:mb-8 md:px-5"
        >
          <div className="flex items-center gap-3 text-sm text-zinc-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
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
              <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Auth Studio
            </div>
              <div className="font-semibold text-zinc-900">Authentication & Roles</div>
          </div>
        </div>
          <Link
            href="/"
            className={editorialButtonClass({
              tone: "secondary",
              size: "sm",
              className: "bg-[#f8f3e7] text-zinc-900 hover:bg-[#f1ead8]",
            })}
          >
            Back home
          </Link>
        </EditorialCard>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <EditorialCard
            tone="dark"
            className="overflow-hidden text-[#f5efe4] shadow-[0_26px_85px_-50px_rgba(0,0,0,0.55)]"
          >
            <div className="pointer-events-none absolute hidden" />
            <div className="relative p-5 md:p-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d0c5b4]">
                  Secure Access
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-white md:text-4xl">
                  Sign in, get routed, keep moving.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#e1d5c2]">
                  Built for buyers, agents, and admins with role-aware routing after authentication.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#cdbfa8]">Mode</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </p>
                  <p className="mt-1 text-xs text-[#d8ccb9]">
                    {isSignUp ? "Email confirmation may be required." : "Resume your existing account."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#cdbfa8]">Next Step</p>
                  <p className="mt-2 text-lg font-semibold text-white">Role Routing</p>
                  <p className="mt-1 text-xs text-[#d8ccb9]">
                    {redirect ? "Custom redirect requested." : "Agent/Admin/Public destinations."}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#cdbfa8]">Flow Notes</p>
                <ul className="mt-3 space-y-2 text-sm text-[#e4d8c5]">
                  <li className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                    Email/password validation runs before Supabase requests.
                  </li>
                  <li className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                    Missing profiles are auto-created with a public role.
                  </li>
                  <li className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                    Confirmation email can be resent if signup is pending.
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-[#d8ccb9]">
                {roleRoutingNote}
              </div>
            </div>
          </EditorialCard>

          <div className="w-full">
            <form
              onSubmit={handleAuth}
              className="relative space-y-6"
              aria-busy={busy || resendBusy}
            >
              <EditorialCard className="space-y-6 bg-white/90 p-5 shadow-[0_26px_85px_-55px_rgba(0,0,0,0.45)] md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {isSignUp ? "Account Creation" : "Account Access"}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-zinc-950 md:text-3xl">
                    {panelTitle}
                  </h1>
                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">{panelSubtitle}</p>
                </div>
                <div
                  className="flex gap-2 rounded-full border border-zinc-900/10 bg-[#f8f3e7] p-1 text-xs font-semibold text-zinc-900"
                  role="group"
                  aria-label="Authentication mode"
                >
                <button
                  type="button"
                  aria-pressed={mode === "signin"}
                  onClick={() => {
                    setMode("signin");
                    setPendingEmail(null);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signin"
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "signup"}
                  onClick={() => {
                    setMode("signup");
                    setPendingEmail(null);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "signup"
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Create account
                </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor={emailInputId} className="text-sm font-semibold text-zinc-800">
                  Email
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? authErrorId : undefined}
                    className="w-full rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none transition focus:border-zinc-900/25 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                  <label htmlFor={passwordInputId} className="flex items-center justify-between gap-2 text-sm font-semibold text-zinc-800">
                  <span>Password</span>
                    {mode === "signup" && (
                      <span id={passwordRulesId} className="text-xs font-normal text-zinc-600">
                      8+ chars, uppercase, lowercase, number
                    </span>
                  )}
                </label>
                <input
                  id={passwordInputId}
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    mode === "signup"
                      ? `${passwordRulesId}${error ? ` ${authErrorId}` : ""}`
                      : error
                        ? authErrorId
                        : undefined
                  }
                    className="w-full rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none transition focus:border-zinc-900/25 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="********"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                    <label htmlFor={confirmPasswordInputId} className="text-sm font-semibold text-zinc-800">
                    Confirm password
                  </label>
                  <input
                    id={confirmPasswordInputId}
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? authErrorId : undefined}
                      className="w-full rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none transition focus:border-zinc-900/25 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
                    placeholder="Repeat password"
                  />
                </div>
              )}
              </div>

              {error && (
                <EditorialNotice id={authErrorId} tone="error">
                  {error}
                </EditorialNotice>
              )}
              {notice && (
                <EditorialNotice id={authNoticeId} tone="success">
                  {notice}
                </EditorialNotice>
              )}

              {pendingEmail && (
                <EditorialNotice id={authPendingId} className="text-xs leading-5">
                  <div className="font-semibold text-zinc-900">
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
                    aria-describedby={authPendingId}
                    className={editorialButtonClass({
                      tone: "secondary",
                      size: "sm",
                      className: "mt-3 px-3 py-1.5 text-xs disabled:opacity-60",
                    })}
                  >
                    {resendBusy ? "Sending..." : "Resend confirmation email"}
                  </button>
                </EditorialNotice>
              )}

              <button
                type="submit"
                disabled={busy}
                aria-describedby={
                  error ? authErrorId : notice ? authNoticeId : pendingEmail ? authPendingId : undefined
                }
                className={editorialButtonClass({
                  tone: "primary",
                  className:
                    "flex w-full gap-2 rounded-2xl shadow-[0_20px_50px_-35px_rgba(0,0,0,0.55)]",
                })}
              >
                {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
              </button>

              <EditorialCard tone="plain" radius="lg" className="px-4 py-3 text-xs text-zinc-600">
                {isSignUp ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setPendingEmail(null);
                        setError(null);
                        setNotice(null);
                      }}
                      className="font-semibold text-zinc-900 underline"
                    >
                      Sign in
                    </button>
                  </span>
                ) : (
                  <span>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setPendingEmail(null);
                        setError(null);
                        setNotice(null);
                      }}
                      className="font-semibold text-zinc-900 underline"
                    >
                      Create an account
                    </button>
                  </span>
                )}
              </EditorialCard>
              </EditorialCard>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}


