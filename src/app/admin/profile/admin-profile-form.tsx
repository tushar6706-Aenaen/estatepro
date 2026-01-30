"use client";

import { useEffect, useMemo, useState } from "react";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  role: "public" | "agent" | "admin" | null;
};

export function AdminProfileForm() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<ProfileRow["role"]>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabaseReady) {
        setError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      const { data, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Sign in to manage your admin profile.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile, error: profileError } =
        await supabaseBrowserClient
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

      if (profileError && profileError.code !== "PGRST116") {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setRole(profile.role ?? "admin");
      } else {
        setRole("admin");
      }

      setLoading(false);
    };

    loadProfile();
  }, [supabaseReady]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabaseReady) {
      setError("Supabase environment variables are missing in .env.local.");
      return;
    }

    setSaving(true);

    const { data, error: authError } =
      await supabaseBrowserClient.auth.getUser();

    if (authError) {
      setError(authError.message);
      setSaving(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("Please sign in before saving your profile.");
      setSaving(false);
      return;
    }

    const payload = {
      id: user.id,
      full_name: fullName.trim() ? fullName.trim() : null,
      phone: phone.trim() ? phone.trim() : null,
      role: role ?? "admin",
    };

    const { error: updateError } = await supabaseBrowserClient
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Profile updated successfully.");
    }

    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Admin Profile</h3>
          <p className="text-xs text-neutral-400">
            Update your public admin details.
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          ADMIN
        </span>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="h-10 w-full rounded-xl bg-white/5" />
          <div className="h-10 w-full rounded-xl bg-white/5" />
          <div className="h-10 w-full rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Email
            </label>
            <input
              value={email ?? ""}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Phone
            </label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Add a phone number"
              className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Role
            </label>
            <input
              value={role ?? "admin"}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-400"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || loading}
        className="mt-5 w-full rounded-full bg-neutral-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
