import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";

function PropertySkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-zinc-900/10 bg-white shadow-sm"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="h-48 w-full animate-pulse bg-zinc-200" />
      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="h-9 w-28 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

export default function PropertiesLoading() {
  return (
    <div className={`${editorialPageRootClass} min-h-screen bg-[#f2eee3] pb-20 md:pb-0`}>
      <div className="relative isolate overflow-hidden">
        <EditorialBackdrop
          radialClassName="absolute inset-0 left-0 w-full translate-x-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.1),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(234,88,12,0.1),transparent_45%)]"
          gridClassName="absolute inset-0 left-0 w-full translate-x-0 opacity-[0.08]"
        />
        <HomeHeader />

        <main className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <EditorialCard className="rounded-[1.6rem] bg-white/80 p-5 shadow-none md:p-6">
            <div className="space-y-3">
              <div className="h-3 w-36 animate-pulse rounded bg-zinc-200" />
              <div className="h-9 w-72 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-80 animate-pulse rounded bg-zinc-100" />
            </div>
          </EditorialCard>

          <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <PropertySkeletonCard key={index} index={index} />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
