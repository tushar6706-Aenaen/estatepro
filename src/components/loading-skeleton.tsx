export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-lg">
      {/* Image Skeleton */}
      <div className="relative h-56 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 skeleton" />

      {/* Content Skeleton */}
      <div className="space-y-3 px-5 py-5">
        <div>
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg skeleton mb-2" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg skeleton w-2/3" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg skeleton w-16" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg skeleton w-16" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg skeleton w-20" />
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
