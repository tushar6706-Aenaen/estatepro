"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import { RoleGuard } from "@/src/components/auth/role-guard";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { AgentProfileForm } from "./agent-profile-form";

type AgentProfileRow = {
  full_name: string | null;
  city: string | null;
  state: string | null;
  agent_title: string | null;
  rating: number | null;
  reviews_count: number | null;
  avatar_url: string | null;
};

type PropertyRow = {
  id: string;
  title: string | null;
  price: number | string | null;
  city: string | null;
  status: string | null;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

type ListingCard = {
  id: string;
  title: string;
  price: string;
  address: string;
  status: string;
  statusClass: string;
  image: string | null;
};

type StatState = {
  total: number;
  sold: number;
  clients: number;
  totalDelta: number;
  soldDelta: number;
  clientsDelta: number;
};

const formatDelta = (value: number) => {
  if (!Number.isFinite(value)) return "--";
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}%`;
};

const calculateDelta = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
};

const statusMap: Record<
  string,
  { label: string; className: string }
> = {
  approved: {
    label: "Active",
    className: "bg-emerald-500/20 text-emerald-300",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/20 text-amber-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/20 text-red-300",
  },
};

export default function AgentProfilePage() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AgentProfileRow | null>(null);
  const [stats, setStats] = useState<StatState>({
    total: 0,
    sold: 0,
    clients: 0,
    totalDelta: 0,
    soldDelta: 0,
    clientsDelta: 0,
  });
  const [listings, setListings] = useState<ListingCard[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!supabaseReady) {
        setLoadError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const { data: authData, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (authError || !authData.user) {
        setLoadError("Sign in to view your agent profile.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      const now = new Date();
      const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        profileResponse,
        listingsResponse,
        totalCount,
        soldCount,
        clientsCount,
        totalCurrent,
        totalPrevious,
        soldCurrent,
        soldPrevious,
        clientsCurrent,
        clientsPrevious,
      ] = await Promise.all([
        supabaseBrowserClient
          .from("profiles")
          .select("full_name, city, state, agent_title, rating, reviews_count, avatar_url")
          .eq("id", userId)
          .maybeSingle<AgentProfileRow>(),
        supabaseBrowserClient
          .from("properties")
          .select("id,title,price,city,status,property_images(image_url,is_primary)")
          .eq("agent_id", userId)
          .order("created_at", { ascending: false })
          .limit(4),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .eq("status", "approved"),
        supabaseBrowserClient
          .from("inquiries")
          .select("id, properties!inner(agent_id)", { count: "exact", head: true })
          .eq("properties.agent_id", userId),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .eq("status", "approved")
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .eq("status", "approved")
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("inquiries")
          .select("id, properties!inner(agent_id)", { count: "exact", head: true })
          .eq("properties.agent_id", userId)
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("inquiries")
          .select("id, properties!inner(agent_id)", { count: "exact", head: true })
          .eq("properties.agent_id", userId)
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
      ]);

      if (cancelled) return;

      const errors = [
        profileResponse.error,
        listingsResponse.error,
        totalCount.error,
        soldCount.error,
        clientsCount.error,
        totalCurrent.error,
        totalPrevious.error,
        soldCurrent.error,
        soldPrevious.error,
        clientsCurrent.error,
        clientsPrevious.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setLoadError(errors[0]?.message ?? "Unable to load agent data.");
      }

      setProfile(profileResponse.data ?? null);

      const propertyRows = (listingsResponse.data ?? []) as PropertyRow[];
      const mappedListings = propertyRows.map((item) => {
        const priceNumber = Number(item.price);
        const price = Number.isFinite(priceNumber)
          ? `$${priceNumber.toLocaleString()}`
          : item.price
            ? `$${item.price}`
            : "$0";

        const statusInfo =
          (item.status && statusMap[item.status]) ?? {
            label: item.status ? item.status : "Draft",
            className: "bg-neutral-500/20 text-neutral-300",
          };

        const images = item.property_images ?? [];
        const primaryImage =
          images.find((image) => image.is_primary) ?? images[0];

        return {
          id: item.id,
          title: item.title ?? "Untitled listing",
          price,
          address: item.city ?? "Location pending",
          status: statusInfo.label,
          statusClass: statusInfo.className,
          image: primaryImage?.image_url ?? null,
        };
      });

      setListings(mappedListings);

      setStats({
        total: totalCount.count ?? 0,
        sold: soldCount.count ?? 0,
        clients: clientsCount.count ?? 0,
        totalDelta: calculateDelta(
          totalCurrent.count ?? 0,
          totalPrevious.count ?? 0,
        ),
        soldDelta: calculateDelta(
          soldCurrent.count ?? 0,
          soldPrevious.count ?? 0,
        ),
        clientsDelta: calculateDelta(
          clientsCurrent.count ?? 0,
          clientsPrevious.count ?? 0,
        ),
      });

      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  const profileName = profile?.full_name || "Your Agent Profile";
  const profileTitle = profile?.agent_title || "Real Estate Agent";
  const profileRating = profile?.rating
    ? `${profile.rating.toFixed(1)} * (${profile.reviews_count ?? 0} Reviews)`
    : "New agent";
  const profileLocation =
    profile?.city && profile?.state
      ? `${profile.city}, ${profile.state}`
      : profile?.city
        ? profile.city
        : "Location not set";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <RoleGuard allowedRoles={["agent", "admin"]}>
          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {loadError}
            </div>
          )}

          <section className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-6">
              <div
                className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-neutral-800"
                style={
                  profile?.avatar_url
                    ? {
                        backgroundImage: `url(${profile.avatar_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!profile?.avatar_url && (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                    {profileName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-neutral-950 bg-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-white">
                    {loading ? "Loading..." : profileName}
                  </h1>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Agent
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-300">
                  {loading ? "" : `${profileTitle} - ${profileRating}`}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{profileLocation}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#edit-profile"
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
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
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Edit Profile
                </Link>
                <Link
                  href="/agent"
                  className="flex items-center gap-2 rounded-full bg-neutral-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-400"
                >
                  <span className="text-lg leading-none">+</span>
                  Add New Property
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
            {[
              {
                label: "Total Listings",
                value: stats.total,
                delta: stats.totalDelta,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 11l9-7 9 7" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                ),
              },
              {
                label: "Sold Properties",
                value: stats.sold,
                delta: stats.soldDelta,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41 11 3.83" />
                    <path d="M5 7h6" />
                    <path d="M14 16h5" />
                    <path d="M5 17a2 2 0 0 0 2 2h6" />
                    <path d="M5 5a2 2 0 0 1 2-2h6" />
                  </svg>
                ),
              },
              {
                label: "Active Clients",
                value: stats.clients,
                delta: stats.clientsDelta,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5 shadow-[0_20px_40px_-32px_rgba(0,0,0,0.85)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-neutral-200">
                    {card.icon}
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {loading ? "--" : formatDelta(card.delta)}
                  </span>
                </div>
                <p className="mt-4 text-sm text-neutral-400">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "--" : card.value.toLocaleString()}
                </p>
              </div>
            ))}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-neutral-200">
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
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-4 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Agent Dashboard
                  </h3>
                  <p className="text-sm text-neutral-400">
                    View analytics and manage your leads.
                  </p>
                </div>
              </div>
              <Link
                href="/agent"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-300 transition hover:text-white"
              >
                Go to Dashboard ->
              </Link>
            </div>
          </section>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Listings</h2>
              <button className="text-sm font-semibold text-neutral-300 transition hover:text-white">
                View All
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {loading && (
                <div className="col-span-full text-sm text-neutral-400">
                  Loading listings...
                </div>
              )}
              {!loading && listings.length === 0 && (
                <div className="col-span-full text-sm text-neutral-400">
                  You do not have any listings yet.
                </div>
              )}
              {!loading &&
                listings.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60"
                  >
                    <div
                      className="relative h-36 bg-neutral-800"
                      style={
                        item.image
                          ? {
                              backgroundImage: `url(${item.image})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${item.statusClass}`}
                      >
                        {item.status}
                      </span>
                      <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                        ...
                      </button>
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-lg font-semibold text-white">
                        {item.price}
                      </p>
                      <p className="text-sm text-neutral-200">{item.title}</p>
                      <p className="text-xs text-neutral-500">{item.address}</p>
                    </div>
                  </div>
                ))}

              <Link
                href="/agent"
                className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-neutral-900/40 px-6 py-12 text-center text-sm text-neutral-300 transition hover:border-white/30 hover:text-white"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl">
                  +
                </span>
                List New Property
              </Link>
            </div>
          </section>

          <section id="edit-profile" className="mt-10">
            <AgentProfileForm />
          </section>
        </RoleGuard>
      </main>
    </div>
  );
}

