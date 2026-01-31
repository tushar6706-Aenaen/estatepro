"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import { RoleGuard } from "@/src/components/auth/role-guard";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { AdminProfileForm } from "./admin-profile-form";

type StatState = {
  pending: number;
  users: number;
  properties: number;
  pendingDelta: number;
  usersDelta: number;
  propertiesDelta: number;
};

type ApprovalRow = {
  id: string;
  title: string | null;
  city: string | null;
  created_at: string | null;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
  profiles?: { full_name: string | null }[] | null;
};

type ApprovalItem = {
  id: string;
  title: string;
  location: string;
  agent: string;
  time: string;
  imageUrl: string | null;
};

const statDefinitions = [
  {
    key: "pending",
    label: "Pending Listings",
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
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M7 8h10" />
        <path d="M7 12h6" />
      </svg>
    ),
  },
  {
    key: "users",
    label: "Total Users",
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
  {
    key: "properties",
    label: "Total Properties",
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
];

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

const timeAgo = (dateString: string | null) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function AdminProfilePage() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatState>({
    pending: 0,
    users: 0,
    properties: 0,
    pendingDelta: 0,
    usersDelta: 0,
    propertiesDelta: 0,
  });
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);

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
        setLoadError("Sign in with an admin account to view this profile.");
        setLoading(false);
        return;
      }

      const now = new Date();
      const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        pendingCount,
        userCount,
        propertyCount,
        pendingCurrent,
        pendingPrevious,
        userCurrent,
        userPrevious,
        propertyCurrent,
        propertyPrevious,
        approvalsResponse,
      ] = await Promise.all([
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabaseBrowserClient
          .from("profiles")
          .select("id", { count: "exact", head: true }),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true }),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .gte("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select("id", { count: "exact", head: true })
          .gte("created_at", previousStart.toISOString())
          .lt("created_at", currentStart.toISOString()),
        supabaseBrowserClient
          .from("properties")
          .select(
            "id,title,city,created_at,property_images(image_url,is_primary),profiles:agent_id(full_name)",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (cancelled) return;

      const errors = [
        pendingCount.error,
        userCount.error,
        propertyCount.error,
        pendingCurrent.error,
        pendingPrevious.error,
        userCurrent.error,
        userPrevious.error,
        propertyCurrent.error,
        propertyPrevious.error,
        approvalsResponse.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setLoadError(errors[0]?.message ?? "Unable to load admin data.");
      }

      setStats({
        pending: pendingCount.count ?? 0,
        users: userCount.count ?? 0,
        properties: propertyCount.count ?? 0,
        pendingDelta: calculateDelta(
          pendingCurrent.count ?? 0,
          pendingPrevious.count ?? 0,
        ),
        usersDelta: calculateDelta(
          userCurrent.count ?? 0,
          userPrevious.count ?? 0,
        ),
        propertiesDelta: calculateDelta(
          propertyCurrent.count ?? 0,
          propertyPrevious.count ?? 0,
        ),
      });

      const approvalData = (approvalsResponse.data ?? []) as ApprovalRow[];
      const mappedApprovals = approvalData.map((item) => {
        const images = item.property_images ?? [];
        const primaryImage =
          images.find((image) => image.is_primary) ?? images[0];

        return {
          id: item.id,
          title: item.title ?? "Untitled listing",
          location: item.city ?? "Location pending",
          agent: item.profiles?.[0]?.full_name ?? "Unknown agent",
          time: timeAgo(item.created_at),
          imageUrl: primaryImage?.image_url ?? null,
        };
      });

      setApprovals(mappedApprovals);
      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <RoleGuard allowedRoles={["admin"]}>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <Link className="transition hover:text-gray-900" href="/">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-800">Admin Profile</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                Admin Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                Overview
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300/30 hover:text-gray-900">
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
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                </svg>
                Settings
              </button>
              <button className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800">
                <span className="text-lg leading-none">+</span>
                New Listing
              </button>
            </div>
          </div>

          {loadError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {loadError}
            </div>
          )}

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {statDefinitions.map((card) => {
              const valueMap = {
                pending: stats.pending,
                users: stats.users,
                properties: stats.properties,
              };
              const deltaMap = {
                pending: stats.pendingDelta,
                users: stats.usersDelta,
                properties: stats.propertiesDelta,
              };
              const value = valueMap[card.key as keyof typeof valueMap];
              const delta = deltaMap[card.key as keyof typeof deltaMap];

              return (
                <div
                  key={card.label}
                  className="rounded-3xl border border-gray-300 bg-white p-5 shadow-[0_20px_40px_-32px_rgba(0,0,0,0.85)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
                      {card.icon}
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      {loading ? "--" : formatDelta(delta)}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {loading ? "--" : value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-gray-300 bg-white">
              <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <button className="text-sm font-semibold text-gray-700 transition hover:text-gray-900">
                  View All
                </button>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr] gap-4 border-b border-gray-300 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  <span>Property</span>
                  <span>Agent</span>
                  <span>Date</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {loading && (
                    <div className="py-6 text-sm text-gray-600">
                      Loading approvals...
                    </div>
                  )}
                  {!loading && approvals.length === 0 && (
                    <div className="py-6 text-sm text-gray-600">
                      No pending approvals right now.
                    </div>
                  )}
                  {!loading &&
                    approvals.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr] gap-4 py-4 text-sm text-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-12 rounded-xl bg-gray-100"
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
                          <div>
                            <p className="text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-8 w-8 rounded-full bg-gray-100" />
                          <span>{item.agent}</span>
                        </div>
                        <div>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            {item.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-red-400 transition hover:text-red-300">
                            x
                          </button>
                          <button className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800">
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AdminProfileForm />

              <div className="rounded-3xl border border-gray-300 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-500/20 text-gray-800">
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
                    <h3 className="text-lg font-semibold text-gray-900">Deep Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Access comprehensive reports, user behavior analysis, and
                      revenue trends inside the admin dashboard.
                    </p>
                  </div>
                </div>
                <button className="mt-5 w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300/30 hover:text-gray-900">
                  Go to Admin Dashboard 
                </button>
              </div>

              <div className="rounded-3xl border border-gray-300 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  {[
                    "Invite Agent",
                    "Review Reports",
                    "Platform Config",
                  ].map((action) => (
                    <button
                      key={action}
                      className="flex w-full items-center justify-between rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-left transition hover:border-gray-300/20"
                    >
                      <span>{action}</span>
                      <span className="text-neutral-500"></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </RoleGuard>
      </main>
    </div>
  );
}

