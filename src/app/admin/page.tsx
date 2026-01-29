import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";
import { AdminDashboard } from "./admin-dashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-neutral-500">
              Admin
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Review queue
            </h1>
            <p className="mt-2 text-sm text-neutral-300">
              Access for admins only. Use this page as the entry point for
              Phase 4 review tools.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
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
