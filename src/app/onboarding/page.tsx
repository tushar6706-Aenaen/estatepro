"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "../../lib/supabase/client";

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

    if (roleChoice === "agent" && phone.trim().length < 6) {
      setError("Please add a phone number so buyers can reach you.");
      return;
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
      phone: roleChoice === "agent" ? phone.trim() : null,
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 px-4 py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Profile setup
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Tell us how you want to use the platform.
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            This helps us tailor your experience. You can change this later in
            settings if your goals change.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur"
        >
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-10 rounded bg-slate-200" />
              <div className="h-10 rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRoleChoice("buyer")}
                  className={`flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                    roleChoice === "buyer"
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                    I want to buy
                  </span>
                  <span className="text-xl font-semibold">
                    Browse homes and contact agents.
                  </span>
                  <span
                    className={`text-sm ${
                      roleChoice === "buyer" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    See approved listings only.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleChoice("agent")}
                  className={`flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                    roleChoice === "agent"
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                    I want to post
                  </span>
                  <span className="text-xl font-semibold">
                    List properties and manage inquiries.
                  </span>
                  <span
                    className={`text-sm ${
                      roleChoice === "agent" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    We&apos;ll ask for a contact number.
                  </span>
                </button>
              </div>

              {roleChoice === "agent" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Phone number
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-600">
                      +1
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    This will appear on your listings for buyers to contact you.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  You&apos;re all set. Your profile has been updated.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </form>

        {!loading && !hasUser && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            You need to sign in to save your profile.{" "}
            <Link
              href="/auth?redirect=/onboarding"
              className="font-semibold underline underline-offset-4"
            >
              Go to the auth page
            </Link>
            .
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
            your `.env.local` to enable profile updates.
          </div>
        )}
      </div>
    </div>
  );
}
