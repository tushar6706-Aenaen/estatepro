export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="h-6 w-48 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />
          <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
