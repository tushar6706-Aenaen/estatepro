import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";
import { AdminDashboard } from "./admin-dashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-gray-500">
              Admin
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Review queue
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Access for admins only. Use this page as the entry point for
              Phase 4 review tools.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300/30 hover:text-gray-900"
          >
            Back to home
          </Link>
        </header>

        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      </div>
    </div>
  );
}
