export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <div className="h-4 w-40 rounded-full bg-white/10" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-neutral-900/40 p-4 md:grid-cols-4 md:grid-rows-2">
            <div className="col-span-2 row-span-2 h-64 animate-pulse rounded-2xl bg-white/5 md:h-auto" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
            <div className="h-10 w-40 animate-pulse rounded-full bg-white/5" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-10 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="h-8 w-52 animate-pulse rounded-full bg-white/10" />
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
