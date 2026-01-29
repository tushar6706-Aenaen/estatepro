export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-6 space-y-4">
          <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
