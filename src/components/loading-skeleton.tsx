export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      {/* Image Skeleton */}
      <div className="relative h-64 bg-gray-200 skeleton" />

      {/* Content Skeleton */}
      <div className="space-y-3 px-5 py-5">
        <div>
          <div className="h-6 bg-gray-200 rounded skeleton mb-2" />
          <div className="h-4 bg-gray-200 rounded skeleton w-2/3" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded skeleton w-16" />
          <div className="h-4 bg-gray-200 rounded skeleton w-16" />
          <div className="h-4 bg-gray-200 rounded skeleton w-20" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
