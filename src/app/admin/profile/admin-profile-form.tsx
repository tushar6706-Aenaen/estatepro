"use client";

import { useEffect, useMemo, useState } from "react";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
          .select("full_name, phone, city, state, avatar_url, role")
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
        setCity(profile.city ?? "");
        setRegionState(profile.state ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
        setRole(profile.role ?? "admin");
      } else {
        setRole("admin");
      }

      setLoading(false);
    };

    loadProfile();
  }, [supabaseReady]);

  const handleAvatarUpload = async (file: File) => {
    if (!supabaseReady) {
      setError("Supabase environment variables are missing in .env.local.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const { data, error: authError } =
      await supabaseBrowserClient.auth.getUser();

    if (authError || !data.user) {
      setError(authError?.message ?? "Sign in to upload an avatar.");
      setUploading(false);
      return;
    }

    const extension = file.name.split(".").pop() ?? "png";
    const filePath = `${data.user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseBrowserClient.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabaseBrowserClient.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(publicUrlData.publicUrl);
    setUploading(false);
  };

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
      city: city.trim() ? city.trim() : null,
      state: regionState.trim() ? regionState.trim() : null,
      avatar_url: avatarUrl,
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
      className="rounded-3xl border border-gray-300 bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Admin Profile</h3>
          <p className="text-xs text-gray-600">
            Update your public admin details.
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
          ADMIN
        </span>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="h-10 w-full rounded-xl bg-gray-100" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-300 bg-gray-200"
              style={
                avatarUrl
                  ? {
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!avatarUrl && (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-900">
                  {fullName
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "AD"}
                </div>
              )}
              <label
                htmlFor="admin-avatar-upload"
                className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gray-900 text-[10px] font-semibold text-white"
              >
                E
              </label>
              <input
                id="admin-avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleAvatarUpload(file);
                  }
                }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Avatar</p>
              <p className="text-xs text-gray-500">
                {uploading ? "Uploading..." : "PNG, JPG up to 5MB"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Email
            </label>
            <input
              value={email ?? ""}
              readOnly
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Phone
            </label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Add a phone number"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
                City
              </label>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
                State
              </label>
              <input
                value={regionState}
                onChange={(event) => setRegionState(event.target.value)}
                placeholder="State"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Role
            </label>
            <input
              value={role ?? "admin"}
              readOnly
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600"
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
        disabled={saving || loading || uploading}
        className="mt-5 w-full rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

