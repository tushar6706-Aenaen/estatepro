import Link from "next/link";

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            RealEstate
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-10 text-center">
          <div className="mx-auto h-5 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mx-auto mt-4 h-4 w-64 animate-pulse rounded-full bg-white/5" />
        </div>
      </main>
    </div>
  );
}
