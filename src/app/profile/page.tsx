"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type ProfileRow = {
  full_name: string | null;
  city: string | null;
  state: string | null;
  is_premium: boolean | null;
  created_at: string | null;
  avatar_url: string | null;
};

type InquiryRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  property?: {
    title: string | null;
    city: string | null;
    property_images?: { image_url: string | null; is_primary: boolean | null }[];
  } | null;
};

type ActivityItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  badgeClass: string;
  imageUrl: string | null;
};

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/20 text-amber-300" },
  responded: { label: "Responded", className: "bg-sky-500/20 text-sky-300" },
  closed: { label: "Closed", className: "bg-neutral-500/20 text-neutral-300" },
  viewed: { label: "Viewed", className: "bg-emerald-500/20 text-emerald-300" },
};

const formatMonthYear = (dateString: string | null) => {
  if (!dateString) return "Joined recently";
  const date = new Date(dateString);
  return `Joined ${date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
};

const formatShortDate = (dateString: string | null) => {
  if (!dateString) return "recently";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function UserProfilePage() {
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
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [inquiryDelta, setInquiryDelta] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;

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
        setError("Sign in to manage your profile.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const now = new Date();
      const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        profileResponse,
        inquiriesCount,
        inquiriesCurrent,
        inquiriesPrevious,
        inquiryActivity,
      ] =
        await Promise.all([
          supabaseBrowserClient
            .from("profiles")
            .select("full_name, city, state, is_premium, created_at, avatar_url")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabaseBrowserClient
            .from("inquiries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabaseBrowserClient
            .from("inquiries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", currentStart.toISOString()),
          supabaseBrowserClient
            .from("inquiries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", previousStart.toISOString())
            .lt("created_at", currentStart.toISOString()),
          supabaseBrowserClient
            .from("inquiries")
            .select(
              "id,created_at,status,property:property_id(title,city,property_images(image_url,is_primary))",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (cancelled) return;

      if (profileResponse.error && profileResponse.error.code !== "PGRST116") {
        setError(profileResponse.error.message);
      }

      if (inquiriesCount.error) {
        setError(inquiriesCount.error.message);
      }

      if (inquiriesCurrent.error) {
        setError(inquiriesCurrent.error.message);
      }

      if (inquiriesPrevious.error) {
        setError(inquiriesPrevious.error.message);
      }

      if (inquiryActivity.error) {
        setError(inquiryActivity.error.message);
      }

      if (profileResponse.data) {
        setProfile(profileResponse.data);
        setFullName(profileResponse.data.full_name ?? "");
        setCity(profileResponse.data.city ?? "");
        setRegionState(profileResponse.data.state ?? "");
        setAvatarUrl(profileResponse.data.avatar_url ?? null);
      }

      setTotalInquiries(inquiriesCount.count ?? 0);
      setInquiryDelta(
        (inquiriesCurrent.count ?? 0) - (inquiriesPrevious.count ?? 0),
      );

      const inquiryRows = (inquiryActivity.data ?? []) as InquiryRow[];
      const mapped = inquiryRows.map((item) => {
        const statusKey = (item.status ?? "pending").toLowerCase();
        const statusMeta = statusStyles[statusKey] ?? {
          label: item.status ?? "Pending",
          className: "bg-neutral-500/20 text-neutral-300",
        };

        const images = item.property?.property_images ?? [];
        const primaryImage =
          images.find((image) => image.is_primary) ?? images[0];

        return {
          id: item.id,
          title: item.property?.title ?? "Property inquiry",
          date: formatShortDate(item.created_at),
          status: statusMeta.label,
          badgeClass: statusMeta.className,
          imageUrl: primaryImage?.image_url ?? null,
        };
      });

      setActivity(mapped);
      setLoading(false);
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
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
      city: city.trim() ? city.trim() : null,
      state: regionState.trim() ? regionState.trim() : null,
      avatar_url: avatarUrl,
    };

    const { error: updateError } = await supabaseBrowserClient
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Profile updated successfully.");
      setProfile((prev) => ({
        full_name: fullName.trim() ? fullName.trim() : null,
        city: city.trim() ? city.trim() : null,
        state: regionState.trim() ? regionState.trim() : null,
        is_premium: prev?.is_premium ?? null,
        created_at: prev?.created_at ?? null,
        avatar_url: avatarUrl,
      }));
    }

    setSaving(false);
  };

  const displayName = fullName || "Your Name";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const locationText =
    city && regionState
      ? `${city}, ${regionState}`
      : city
        ? city
        : profile?.city && profile?.state
          ? `${profile.city}, ${profile.state}`
          : profile?.city
            ? profile.city
            : "Location not set";

  const joinedText = formatMonthYear(profile?.created_at ?? null);
  const deltaLabel = loading
    ? "--"
    : `${inquiryDelta >= 0 ? "+" : ""}${inquiryDelta}`;
  const deltaText = loading ? "Loading activity..." : `${deltaLabel} since last month`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        >
          <span className="text-lg"><-</span>
          Dashboard
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-neutral-900/60 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="relative h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-neutral-800 text-lg font-semibold text-white"
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
                <div className="flex h-full w-full items-center justify-center">
                  {initials || "U"}
                </div>
              )}
              <label
                htmlFor="user-avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-4 border-neutral-900 bg-neutral-500 text-xs font-bold"
              >
                E
              </label>
              <input
                id="user-avatar-upload"
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
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">
                  {loading ? "Loading..." : displayName}
                </h1>
                <span className="rounded-full border border-neutral-500/40 bg-neutral-500/10 px-3 py-1 text-xs font-semibold text-neutral-200">
                  {profile?.is_premium ? "Premium User" : "Standard User"}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                {email ?? "your.email@example.com"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Location: {locationText}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {joinedText}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Update your details for saved searches and inquiries.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-neutral-300">
              Full Name
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2">
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Full name"
                  className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
                />
              </div>
            </label>
            <label className="space-y-2 text-sm text-neutral-300">
              Email Address (Read only)
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2">
                <input
                  value={email ?? ""}
                  readOnly
                  className="w-full bg-transparent text-sm text-neutral-400 outline-none"
                />
              </div>
            </label>
            <label className="space-y-2 text-sm text-neutral-300">
              City
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2">
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City"
                  className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
                />
              </div>
            </label>
            <label className="space-y-2 text-sm text-neutral-300">
              State
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2">
                <input
                  value={regionState}
                  onChange={(event) => setRegionState(event.target.value)}
                  placeholder="State"
                  className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
                />
              </div>
            </label>

            <div className="md:col-span-2">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                  {success}
                </div>
              )}
              <button
                type="submit"
                disabled={saving || loading || uploading}
                className="rounded-full bg-neutral-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>THIS MONTH</span>
              <span className="rounded-full bg-white/5 px-2 py-1">
                {deltaLabel}
              </span>
            </div>
            <div className="mt-6 text-4xl font-semibold text-white">
              {loading ? "--" : totalInquiries}
            </div>
            <p className="mt-2 text-sm text-neutral-400">Total Inquiries</p>
            <p className="mt-8 text-xs text-emerald-300">{deltaText}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button className="text-sm font-semibold text-neutral-300 transition hover:text-white">
                View All
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {loading && (
                <div className="text-sm text-neutral-400">
                  Loading activity...
                </div>
              )}
              {!loading && activity.length === 0 && (
                <div className="text-sm text-neutral-400">
                  No activity yet.
                </div>
              )}
              {!loading &&
                activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl bg-white/5"
                      style={
                        item.imageUrl
                          ? {
                              backgroundImage: `url(${item.imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Inquired on {item.date}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${item.badgeClass}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


