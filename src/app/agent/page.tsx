import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Agent workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Listings and inquiries
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Access requires an agent or admin role. If you just signed up,
              complete onboarding to switch your role and add a contact number.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
          >
            Back to home
          </Link>
        </header>

        <RoleGuard allowedRoles={["agent", "admin"]}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_-50px_rgba(59,130,246,0.8)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                Queue
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-semibold text-emerald-200">
                  Coming soon
                </span>
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Pending approvals
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Phase 3 will show your submissions awaiting review and any
                feedback from admins.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_-50px_rgba(59,130,246,0.8)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                Actions
                <span className="rounded-full bg-blue-400/15 px-3 py-1 text-[10px] font-semibold text-blue-200">
                  Phase 3
                </span>
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Create listing
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Once listing forms are ready, agents will add price, city, type,
                and photos directly from here.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_-50px_rgba(59,130,246,0.8)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                Inbox
                <span className="rounded-full bg-indigo-400/15 px-3 py-1 text-[10px] font-semibold text-indigo-200">
                  Preview
                </span>
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Buyer inquiries
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Inquiry data will appear here for your approved listings so you
                can respond quickly.
              </p>
            </div>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
}
