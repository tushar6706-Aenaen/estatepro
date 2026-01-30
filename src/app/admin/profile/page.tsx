import Link from "next/link";

import { HomeHeader } from "@/src/components/layout/home-header";
import { RoleGuard } from "@/src/components/auth/role-guard";
import { AdminProfileForm } from "./admin-profile-form";

const statCards = [
  {
    label: "Pending Listings",
    value: "12",
    delta: "+2%",
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
    label: "Total Users",
    value: "1,450",
    delta: "+12%",
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
    label: "Total Properties",
    value: "328",
    delta: "+5%",
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

const approvals = [
  {
    title: "Downtown Loft",
    address: "123 Main St, Apt 4B",
    agent: "Sarah Jenkins",
    time: "2 hours ago",
  },
  {
    title: "Family Home",
    address: "456 Oak Lane",
    agent: "Mike Ross",
    time: "5 hours ago",
  },
  {
    title: "City Center Condo",
    address: "789 Pine St, Unit 12",
    agent: "Jessica Pearson",
    time: "1 day ago",
  },
  {
    title: "Seaside Villa",
    address: "101 Ocean Dr",
    agent: "Louis Litt",
    time: "1 day ago",
  },
  {
    title: "Cozy Cabin",
    address: "88 Forest Rd",
    agent: "Harvey Specter",
    time: "2 days ago",
  },
];

export default function AdminProfilePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <RoleGuard allowedRoles={["admin"]}>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <Link className="transition hover:text-white" href="/">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-200">Admin Profile</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Admin Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Overview
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white">
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
              <button className="flex items-center gap-2 rounded-full bg-neutral-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-400">
                <span className="text-lg leading-none">+</span>
                New Listing
              </button>
            </div>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5 shadow-[0_20px_40px_-32px_rgba(0,0,0,0.85)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-neutral-200">
                    {card.icon}
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {card.delta}
                  </span>
                </div>
                <p className="mt-4 text-sm text-neutral-400">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {card.value}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
                <button className="text-sm font-semibold text-neutral-300 transition hover:text-white">
                  View All
                </button>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr] gap-4 border-b border-white/10 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  <span>Property</span>
                  <span>Agent</span>
                  <span>Date</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-white/5">
                  {approvals.map((item) => (
                    <div
                      key={`${item.title}-${item.agent}`}
                      className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr] gap-4 py-4 text-sm text-neutral-300"
                    >
                      <div>
                        <p className="text-white">{item.title}</p>
                        <p className="text-xs text-neutral-500">{item.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-8 w-8 rounded-full bg-white/10" />
                        <span>{item.agent}</span>
                      </div>
                      <div>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-red-400 transition hover:text-red-300">
                          ✕
                        </button>
                        <button className="rounded-full bg-neutral-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-400">
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

              <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-500/20 text-neutral-200">
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
                    <h3 className="text-lg font-semibold text-white">Deep Analytics</h3>
                    <p className="text-sm text-neutral-400">
                      Access comprehensive reports, user behavior analysis, and
                      revenue trends inside the admin dashboard.
                    </p>
                  </div>
                </div>
                <button className="mt-5 w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white">
                  Go to Admin Dashboard →
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                <div className="mt-4 space-y-3 text-sm text-neutral-300">
                  {[
                    "Invite Agent",
                    "Review Reports",
                    "Platform Config",
                  ].map((action) => (
                    <button
                      key={action}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20"
                    >
                      <span>{action}</span>
                      <span className="text-neutral-500">→</span>
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
