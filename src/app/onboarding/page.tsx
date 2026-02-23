"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowserClient } from "../../lib/supabase/client";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialFieldShell,
  EditorialNotice,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
import { validatePhone, sanitizeString } from "@/src/lib/validation";

type RoleChoice = "buyer" | "agent";

type ProfileRow = {
  role: "public" | "agent" | "admin";
  phone: string | null;
};

const roleMap: Record<RoleChoice, ProfileRow["role"]> = {
  buyer: "public",
  agent: "agent",
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roleChoice, setRoleChoice] = useState<RoleChoice | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [existingRole, setExistingRole] = useState<ProfileRow["role"] | null>(
    null,
  );
  const redirectParam = searchParams.get("redirect") ?? "";

  const resolveRedirect = (value: string) => {
    if (!value.startsWith("/")) return "/";
    return value;
  };

  const isSupabaseConfigured = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data, error: userError } =
        await supabaseBrowserClient.auth.getUser();
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setHasUser(false);
        setLoading(false);
        return;
      }

      setHasUser(true);

      const { data: profile, error: profileError } =
        await supabaseBrowserClient
          .from("profiles")
          .select("role, phone")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

      if (profileError && profileError.code !== "PGRST116") {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile) {
        const normalizedRole =
          profile.role === "agent" || profile.role === "admin"
            ? "agent"
            : "buyer";
        setRoleChoice(normalizedRole);
        setPhone(profile.phone ?? "");
        setExistingRole(profile.role);
      }

      setLoading(false);
    };

    loadProfile();
  }, [isSupabaseConfigured]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!roleChoice) {
      setError("Please choose how you want to use the platform.");
      return;
    }

    if (roleChoice === "agent") {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setError("Please add a phone number so buyers can reach you.");
        return;
      }
      if (!validatePhone(trimmedPhone)) {
        setError("Please enter a valid phone number (10-15 digits).");
        return;
      }
    }

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setSaving(true);

    const { data, error: userError } =
      await supabaseBrowserClient.auth.getUser();
    if (userError) {
      setError(userError.message);
      setSaving(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("Please sign in before continuing.");
      setSaving(false);
      return;
    }

    const nextRole =
      existingRole === "admin" ? "admin" : roleMap[roleChoice];

    const payload = {
      id: user.id,
      role: nextRole,
      phone: roleChoice === "agent" ? sanitizeString(phone.trim()) : null,
    };

    const { error: upsertError } = await supabaseBrowserClient
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    const destination = resolveRedirect(redirectParam);
    router.push(destination);
  };

  const redirectDestination = resolveRedirect(redirectParam);
  const roleStatusLabel = roleChoice
    ? roleChoice === "agent"
      ? "Agent mode selected"
      : "Buyer mode selected"
    : "Choose a role";
  const setupProgress = roleChoice ? (roleChoice === "agent" ? 80 : 60) : 20;
  const onboardingErrorId = "onboarding-form-error";
  const onboardingSuccessId = "onboarding-form-success";
  const onboardingPhoneId = "onboarding-phone";
  const onboardingPhoneNoteId = "onboarding-phone-note";

  return (
    <div className={editorialPageRootClass}>
      <main className="relative isolate mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_14%_8%,rgba(37,99,235,0.12),transparent_38%),radial-gradient(circle_at_86%_16%,rgba(234,88,12,0.1),transparent_44%)]"
        />

        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/auth"
              className={editorialButtonClass({
                tone: "secondary",
                size: "sm",
                className: "gap-2 bg-white/80 font-medium",
              })}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Back to Auth
            </Link>
            <EditorialPill className="bg-white/80 px-4 py-2 uppercase tracking-[0.22em] text-zinc-600">
              Onboarding Studio
            </EditorialPill>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
            <EditorialCard className="overflow-hidden p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Profile Setup
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
                    Tell us how you want to use the platform.
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 md:text-base">
                    We use this to shape your first experience, messaging workflow, and listing tools.
                    You can change your role details later in settings.
                  </p>
                </div>
                <EditorialPill tone="soft">
                  {roleStatusLabel}
                </EditorialPill>
              </div>

              <EditorialCard tone="soft" radius="xl" className="mt-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Setup progress
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-950">
                      {loading ? "Loading..." : `${setupProgress}% configured`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Destination after save: <span className="font-medium text-zinc-700">{redirectDestination}</span>
                    </p>
                  </div>
                  <EditorialCard
                    tone="plain"
                    radius="lg"
                    className="px-4 py-3 text-sm text-zinc-700"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Current path
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {roleChoice === "agent"
                        ? "Agent onboarding"
                        : roleChoice === "buyer"
                          ? "Buyer onboarding"
                          : "Role selection"}
                    </p>
                  </EditorialCard>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-900 via-zinc-700 to-amber-600 transition-[width] duration-500"
                    style={{ width: `${loading ? 28 : setupProgress}%` }}
                  />
                </div>
              </EditorialCard>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <EditorialCard tone="plain" radius="lg" className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Buyer mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    Browse approved listings and message agents.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Best for home seekers and investors exploring inventory before posting.
                  </p>
                </EditorialCard>
                <EditorialCard tone="plain" radius="lg" className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Agent mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    Publish listings and manage inquiries in one place.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Requires a phone number so buyers can contact you directly from listings.
                  </p>
                </EditorialCard>
              </div>

              <EditorialCard tone="dark" radius="xl" className="mt-6 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d1c4af]">
                  What Happens Next
                </p>
                <div className="mt-4 space-y-3 text-sm text-[#e3d7c4]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    We save your role in your profile record and keep your auth account unchanged.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    If you choose agent mode, your phone is validated before we allow submission.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    After saving, we redirect you to <span className="font-semibold text-white">{redirectDestination}</span>.
                  </div>
                </div>
              </EditorialCard>
            </EditorialCard>

            <EditorialCard className="p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Role Selection
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-950 md:text-3xl">
                    Configure your account role
                  </h2>
                </div>
                <EditorialPill>
                  {existingRole === "admin"
                    ? "Admin privileges retained"
                    : existingRole
                      ? `Existing role: ${existingRole}`
                      : "New profile"}
                </EditorialPill>
              </div>

              <form onSubmit={handleSubmit} className="mt-6" aria-busy={loading || saving}>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-40 rounded bg-zinc-200" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="h-36 rounded-2xl bg-zinc-200" />
                      <div className="h-36 rounded-2xl bg-zinc-200" />
                    </div>
                    <div className="h-12 rounded-2xl bg-zinc-200" />
                    <div className="h-11 w-32 rounded-full bg-zinc-200" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        aria-pressed={roleChoice === "buyer"}
                        onClick={() => setRoleChoice("buyer")}
                        className={`group flex h-full flex-col gap-3 rounded-[1.25rem] border p-5 text-left transition ${
                          roleChoice === "buyer"
                            ? "border-zinc-900/20 bg-[#f8f3e7] shadow-[0_20px_50px_-35px_rgba(0,0,0,0.35)]"
                            : "border-zinc-900/10 bg-white hover:border-zinc-900/20 hover:bg-[#fdfaf2]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            I want to buy
                          </span>
                          <span
                            aria-hidden="true"
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                              roleChoice === "buyer"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-300 bg-white text-zinc-400"
                            }`}
                          >
                            {roleChoice === "buyer" ? "✓" : ""}
                          </span>
                        </div>
                        <span className="text-xl font-semibold text-zinc-950">
                          Browse homes and contact agents.
                        </span>
                        <span className="text-sm leading-6 text-zinc-600">
                          View approved listings, compare options, and keep all outreach in your messages inbox.
                        </span>
                        <div className="mt-auto pt-2 text-xs font-medium text-zinc-500 group-hover:text-zinc-700">
                          Recommended for buyers, renters, and investors
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-pressed={roleChoice === "agent"}
                        onClick={() => setRoleChoice("agent")}
                        className={`group flex h-full flex-col gap-3 rounded-[1.25rem] border p-5 text-left transition ${
                          roleChoice === "agent"
                            ? "border-zinc-900/20 bg-[#f8f3e7] shadow-[0_20px_50px_-35px_rgba(0,0,0,0.35)]"
                            : "border-zinc-900/10 bg-white hover:border-zinc-900/20 hover:bg-[#fdfaf2]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            I want to post
                          </span>
                          <span
                            aria-hidden="true"
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                              roleChoice === "agent"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-300 bg-white text-zinc-400"
                            }`}
                          >
                            {roleChoice === "agent" ? "✓" : ""}
                          </span>
                        </div>
                        <span className="text-xl font-semibold text-zinc-950">
                          List properties and manage inquiries.
                        </span>
                        <span className="text-sm leading-6 text-zinc-600">
                          Publish listings, talk to buyers, and track inquiry activity from your dashboard.
                        </span>
                        <div className="mt-auto pt-2 text-xs font-medium text-zinc-500 group-hover:text-zinc-700">
                          Requires a contact number for listing visibility
                        </div>
                      </button>
                    </div>

                    {roleChoice === "agent" && (
                      <EditorialCard tone="soft" radius="xl" className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label
                            htmlFor={onboardingPhoneId}
                            className="text-sm font-semibold text-zinc-800"
                          >
                            Phone number
                          </label>
                          <EditorialPill className="text-zinc-600">
                            Required for agent role
                          </EditorialPill>
                        </div>
                        <EditorialFieldShell className="mt-3 bg-white">
                          <span className="text-sm font-semibold text-zinc-700">+1</span>
                          <input
                            id={onboardingPhoneId}
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            aria-invalid={Boolean(error)}
                            aria-describedby={`${onboardingPhoneNoteId}${error ? ` ${onboardingErrorId}` : ""}`}
                            className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
                          />
                        </EditorialFieldShell>
                        <p
                          id={onboardingPhoneNoteId}
                          className="mt-2 text-xs leading-5 text-zinc-600"
                        >
                          This appears on your listings so buyers can reach you directly.
                        </p>
                      </EditorialCard>
                    )}

                    {error && (
                      <EditorialNotice id={onboardingErrorId} tone="error">
                        {error}
                      </EditorialNotice>
                    )}

                    {success && (
                      <EditorialNotice id={onboardingSuccessId} tone="success">
                        You&apos;re all set. Your profile has been updated.
                      </EditorialNotice>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className={editorialButtonClass({
                          tone: "primary",
                          className: "px-6",
                        })}
                      >
                        {saving ? "Saving..." : "Continue"}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/")}
                        className={editorialButtonClass({ tone: "secondary" })}
                      >
                        Skip for now
                      </button>
                      <span className="text-xs text-zinc-500">
                        {saving
                          ? "Saving your onboarding preferences..."
                          : "You can change this later from profile settings."}
                      </span>
                    </div>
                  </div>
                )}
              </form>
            </EditorialCard>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {!loading && !hasUser && (
              <EditorialNotice
                className="rounded-[1.3rem] border-zinc-900/10 bg-white/85 py-4 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
              >
                You need to sign in to save your profile.{" "}
                <Link
                  href="/auth?redirect=/onboarding"
                  className="font-semibold text-zinc-900 underline underline-offset-4"
                >
                  Go to the auth page
                </Link>
                .
              </EditorialNotice>
            )}

            {!isSupabaseConfigured && (
              <EditorialNotice
                tone="warning"
                className="rounded-[1.3rem] bg-amber-50/90 py-4 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.25)] backdrop-blur-sm"
              >
                Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your `.env.local` to enable profile updates.
              </EditorialNotice>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
