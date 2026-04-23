import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";

export default function Loading() {
  return (
    <div className={editorialPageRootClass}>
      <HomeHeader />

      <main className="relative isolate mx-auto w-full max-w-7xl px-4 pb-16 pt-4 md:px-6 md:pt-6">
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.1),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(234,88,12,0.12),transparent_40%)]"
        />

        <div className="relative space-y-6 md:space-y-8">
          <EditorialCard className="bg-white/80 p-5 shadow-[0_22px_75px_-55px_rgba(0,0,0,0.45)] md:p-6">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <div className="h-7 w-28 animate-pulse rounded-full bg-zinc-200" />
                <div className="h-10 w-2/3 animate-pulse rounded-xl bg-zinc-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              </div>
              <div className="rounded-[1.25rem] border border-zinc-900/10 bg-[#141312] p-5">
                <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
                <div className="mt-3 h-10 w-32 animate-pulse rounded bg-white/20" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                  <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                </div>
              </div>
            </div>
          </EditorialCard>

          <section className="grid gap-3 md:gap-4 lg:grid-cols-[2.2fr_1fr]">
            <div className="aspect-square w-full animate-pulse rounded-3xl border border-zinc-900/10 bg-zinc-200" />
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square w-full animate-pulse rounded-2xl border border-zinc-900/10 bg-zinc-200"
                />
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:gap-8 xl:grid-cols-[1.55fr_0.95fr]">
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-3xl border border-zinc-900/10 bg-white/80" />
              <div className="h-40 animate-pulse rounded-3xl border border-zinc-900/10 bg-white/80" />
              <div className="h-64 animate-pulse rounded-3xl border border-zinc-900/10 bg-white/80" />
            </div>
            <div className="space-y-4">
              <div className="h-72 animate-pulse rounded-3xl border border-zinc-900/10 bg-white/85" />
              <div className="h-56 animate-pulse rounded-3xl border border-zinc-900/10 bg-[#141312]" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
