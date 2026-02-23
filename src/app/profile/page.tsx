"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialFieldShell,
  EditorialNotice,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
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
  property:
    | {
        title: string | null;
        city: string | null;
        property_images?: { image_url: string | null; is_primary: boolean | null }[];
      }
    | {
        title: string | null;
        city: string | null;
        property_images?: { image_url: string | null; is_primary: boolean | null }[];
      }[]
    | null;
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
  pending: { label: "Pending", className: "border border-amber-200 bg-amber-50 text-amber-700" },
  responded: { label: "Responded", className: "border border-sky-200 bg-sky-50 text-sky-700" },
  closed: { label: "Closed", className: "border border-zinc-200 bg-zinc-100 text-zinc-700" },
  viewed: { label: "Viewed", className: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
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
          className: "border border-zinc-200 bg-zinc-100 text-zinc-700",
        };

        // Supabase may return the joined property as an object or array
        const propertyData = Array.isArray(item.property)
          ? item.property[0]
          : item.property;
        const images = propertyData?.property_images ?? [];
        const primaryImage =
          images.find((image) => image.is_primary) ?? images[0];

        return {
          id: item.id,
          title: propertyData?.title ?? "Property inquiry",
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
  const premiumLabel = profile?.is_premium ? "Premium User" : "Standard User";
  const profileFieldsCompleted = [fullName, city, regionState].filter(
    (value) => value.trim().length > 0,
  ).length;
  const profileCompletionPercent = Math.round((profileFieldsCompleted / 3) * 100);
  const readinessLabel =
    profileCompletionPercent === 100 ? "Complete" : profileCompletionPercent >= 67 ? "Strong" : "Needs update";

  return (
    <div className={editorialPageRootClass}>
      <HomeHeader />

      <main className="relative isolate mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(234,88,12,0.1),transparent_42%)]"
        />

        <div className="relative">
        <Link
          href="/"
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
          Dashboard
        </Link>

        <EditorialCard className="mt-4 overflow-hidden p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
            <div className="flex flex-wrap items-center gap-5">
            <div
              className="relative h-24 w-24 overflow-hidden rounded-3xl border border-zinc-900/10 bg-[#f8f3e7] text-xl font-semibold text-zinc-900 shadow-sm"
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
                  aria-label={uploading ? "Uploading profile photo" : "Upload profile photo"}
                  title={uploading ? "Uploading profile photo" : "Upload profile photo"}
                  className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-xs font-bold text-white shadow"
              >
                  {uploading ? "..." : "E"}
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Profile Studio
                  </p>
                  <EditorialPill tone="soft">
                    {readinessLabel}
                  </EditorialPill>
                </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-zinc-950 md:text-3xl">
                  {loading ? "Loading..." : displayName}
                </h1>
                  <EditorialPill className="text-zinc-800">
                  {premiumLabel}
                </EditorialPill>
              </div>
                <p className="mt-1 text-sm text-zinc-600">
                {email ?? "your.email@example.com"}
              </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-700">
                  <EditorialPill tone="soft" className="py-1.5 font-medium">
                  Location: {locationText}
                </EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">
                  {joinedText}
                </EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">
                    Completion: {loading ? "--" : `${profileCompletionPercent}%`}
                  </EditorialPill>
                </div>
              </div>
            </div>

            <EditorialCard tone="dark" radius="xl" className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d1c4af]">
                Activity Snapshot
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#cdbfa8]">
                    Total inquiries
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {loading ? "--" : totalInquiries}
                  </p>
                  <p className="mt-1 text-xs text-[#d7cab6]">{deltaText}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#cdbfa8]">
                    Profile readiness
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {loading ? "--" : `${profileCompletionPercent}%`}
                  </p>
                  <p className="mt-1 text-xs text-[#d7cab6]">
                    Keep city and state updated for better inquiry routing.
                  </p>
                </div>
              </div>
            </EditorialCard>
          </div>
        </EditorialCard>

        <EditorialCard className="mt-6 p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Edit Profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950 md:text-3xl">
                Keep your account details current
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Update your contact and location details for saved searches, inquiries, and role-based
                experiences across the platform.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 grid gap-4 md:grid-cols-2"
                aria-busy={loading || saving || uploading}
              >
                <label className="space-y-2 text-sm text-zinc-700">
                  Full Name
                  <EditorialFieldShell>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Full name"
                      className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-500 outline-none"
                    />
                  </EditorialFieldShell>
                </label>
                <label className="space-y-2 text-sm text-zinc-700">
                  Email Address (Read only)
                  <EditorialFieldShell tone="readonly">
                    <input
                      value={email ?? ""}
                      readOnly
                      className="w-full bg-transparent text-sm text-zinc-600 outline-none"
                    />
                  </EditorialFieldShell>
                </label>
                <label className="space-y-2 text-sm text-zinc-700">
                  City
                  <EditorialFieldShell>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="City"
                      className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-500 outline-none"
                    />
                  </EditorialFieldShell>
                </label>
                <label className="space-y-2 text-sm text-zinc-700">
                  State
                  <EditorialFieldShell>
                    <input
                      value={regionState}
                      onChange={(event) => setRegionState(event.target.value)}
                      placeholder="State"
                      className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-500 outline-none"
                    />
                  </EditorialFieldShell>
                </label>

                <div className="md:col-span-2">
                  {error && (
                    <EditorialNotice tone="error" className="mb-4">
                      {error}
                    </EditorialNotice>
                  )}
                  {success && (
                    <EditorialNotice tone="success" className="mb-4">
                      {success}
                    </EditorialNotice>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving || loading || uploading}
                      className={editorialButtonClass({
                        tone: "primary",
                        size: "sm",
                        className: "px-6 disabled:opacity-60",
                      })}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <span className="text-xs text-zinc-500" aria-live="polite">
                      {uploading ? "Uploading avatar..." : "Profile updates sync immediately."}
                    </span>
                  </div>
                </div>
              </form>
            </div>

            <EditorialCard tone="dark" radius="xl" className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d2c4ad]">
                Profile Settings Notes
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#e2d5c1]">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Add your city and state so inquiry summaries and recommendations stay relevant.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Upload a profile image to make chats and inquiries easier to identify.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Your email address is managed by authentication and stays read-only here.
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#d8ccb9]">
                Profile completion score is based on your name, city, and state fields.
              </div>
            </EditorialCard>
          </div>
        </EditorialCard>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_2.05fr]">
          <div className="space-y-6">
            <EditorialCard className="p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Profile Ledger
              </p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-950">
                Readiness and account health
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                A quick view of profile completeness and recent inquiry momentum.
              </p>

              <EditorialCard tone="soft" radius="lg" className="mt-5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Completion score
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-zinc-950">
                      {loading ? "--" : `${profileCompletionPercent}%`}
                    </p>
                  </div>
                  <EditorialPill className="text-zinc-800">
                    {readinessLabel}
                  </EditorialPill>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-900 via-zinc-700 to-amber-600 transition-[width] duration-500"
                    style={{
                      width: `${loading ? 18 : Math.max(profileCompletionPercent, 10)}%`,
                    }}
                  />
                </div>
              </EditorialCard>

              <div className="mt-4 space-y-2">
                {[
                  { label: "Full name", value: fullName.trim() },
                  { label: "City", value: city.trim() },
                  { label: "State", value: regionState.trim() },
                ].map((field) => (
                  <EditorialCard
                    key={field.label}
                    tone="plain"
                    radius="lg"
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-zinc-700">{field.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        field.value
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {field.value ? "Added" : "Missing"}
                    </span>
                  </EditorialCard>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <EditorialCard tone="plain" radius="lg" className="px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    Membership
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {premiumLabel}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{joinedText}</p>
                </EditorialCard>
                <EditorialCard tone="plain" radius="lg" className="px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    Inquiry momentum
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {loading ? "--" : totalInquiries} total
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{deltaText}</p>
                </EditorialCard>
              </div>
            </EditorialCard>

            <EditorialCard tone="dark" radius="xl" className="rounded-[1.6rem] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d1c4af]">
                Workflow Notes
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#e3d7c4]">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Keep your profile updated so agents can identify you quickly in chats.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Location details improve property recommendations and inquiry summaries.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Avatar updates appear across conversations after the profile save completes.
                </div>
              </div>
            </EditorialCard>
          </div>

          <EditorialCard className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Activity Feed
                </p>
                <h3 className="mt-2 text-xl font-semibold text-zinc-950 md:text-2xl">
                  Recent inquiry activity
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Latest property inquiries and their current status.
                </p>
              </div>
              <Link
                href="/chats"
                className={editorialButtonClass({ tone: "secondary", size: "sm" })}
              >
                Open Messages
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {loading && (
                <EditorialNotice>
                  Loading activity...
                </EditorialNotice>
              )}
              {!loading && activity.length === 0 && (
                <EditorialNotice>
                  No activity yet. Start exploring listings and send an inquiry to build your timeline.
                </EditorialNotice>
              )}
              {!loading &&
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-900/10 bg-white p-4 shadow-[0_12px_35px_-28px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center"
                  >
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#efe8d8]"
                      style={
                        item.imageUrl
                          ? {
                              backgroundImage: `url(${item.imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      {!item.imageUrl && (
                        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] [background-size:14px_14px]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 md:text-base">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Inquired on {item.date}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${item.badgeClass}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
            </div>
          </EditorialCard>
        </section>
        </div>
      </main>
    </div>
  );
}
