import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Admin
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Review queue
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Access for admins only. Use this page as the entry point for
              Phase 4 review tools.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
          >
            Back to home
          </Link>
        </header>

        <RoleGuard allowedRoles={["admin"]}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_-50px_rgba(59,130,246,0.8)]">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Coming soon
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              Pending listings and inquiries
            </div>
            <p className="mt-2 text-sm text-slate-300">
              When admin workflows are built, this page will surface pending
              listings, provide approve / reject actions, and show inquiries
              across the marketplace.
            </p>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
}
