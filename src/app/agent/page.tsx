import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";
import { AgentDashboard } from "./agent-dashboard";

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-gray-500">
              Agent workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Listings and inquiries
            </h1>
            <p className="max-w-2xl text-sm text-gray-700">
              Access requires an agent or admin role. If you just signed up,
              complete onboarding to switch your role and add a contact number.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300/30 hover:text-gray-900"
          >
            Back to home
          </Link>
        </header>

        <RoleGuard allowedRoles={["agent", "admin"]}>
          <AgentDashboard />
        </RoleGuard>
      </div>
    </div>
  );
}
