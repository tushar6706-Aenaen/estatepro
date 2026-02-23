import Link from "next/link";

import { RoleGuard } from "@/src/components/auth/role-guard";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
import { AgentDashboard } from "./agent-dashboard";

export default function AgentPage() {
  return (
    <div className={`${editorialPageRootClass} relative isolate`}>
      <EditorialBackdrop />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="space-y-6 md:space-y-8">
          <EditorialCard
            className="p-5 sm:p-7 lg:p-8"
            tone="glass"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <EditorialPill className="text-[10px] uppercase tracking-[0.28em] sm:text-xs">
                  Agent workspace
                </EditorialPill>
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl leading-tight text-zinc-950 sm:text-4xl">
                    Listing desk and inquiry studio.
                  </h1>
                  <p className="max-w-2xl text-sm text-zinc-700 sm:text-base">
                    Post new properties, manage review status, and keep your
                    contact details ready for buyer outreach.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditorialPill tone="soft">Agent/Admin only</EditorialPill>
                  <EditorialPill tone="soft">
                    Onboarding phone required
                  </EditorialPill>
                </div>
              </div>

              <Link
                href="/"
                className={editorialButtonClass({
                  tone: "secondary",
                  className: "shrink-0",
                })}
              >
                Back to home
              </Link>
            </header>
          </EditorialCard>

          <RoleGuard allowedRoles={["agent", "admin"]}>
            <AgentDashboard />
          </RoleGuard>
        </div>
      </main>
    </div>
  );
}
