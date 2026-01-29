export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="h-6 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
