export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-6 w-40 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-6 space-y-4">
          <div className="h-32 animate-pulse rounded-3xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
