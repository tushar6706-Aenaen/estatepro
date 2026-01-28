export default async function PropertiesPage() {
  // TODO: Fetch approved properties from Supabase with filters (city, price, type)
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  city?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("properties")
    .select(
      "id, title, city, price, property_type, bedrooms, bathrooms, property_images(image_url, is_primary)"
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (searchParams.city) {
    query = query.ilike("city", `%${searchParams.city}%`);
  }

  if (searchParams.type) {
    query = query.eq("property_type", searchParams.type);
  }

  if (searchParams.minPrice) {
    query = query.gte("price", Number(searchParams.minPrice));
  }

  if (searchParams.maxPrice) {
    query = query.lte("price", Number(searchParams.maxPrice));
  }

  const { data: properties, error } = await query;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
        <p className="text-sm text-neutral-500">
          Browse approved listings. Use filters to narrow down by city, price and type.
        </p>
      </header>
      <form className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm md:grid-cols-4">
        <input
          name="city"
          defaultValue={searchParams.city}
          placeholder="City"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
        <select
          name="type"
          defaultValue={searchParams.type}
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        >
          <option value="">Any type</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="land">Land</option>
          <option value="commercial">Commercial</option>
        </select>
        <input
          type="number"
          name="minPrice"
          defaultValue={searchParams.minPrice}
          placeholder="Min price"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
        <input
          type="number"
          name="maxPrice"
          defaultValue={searchParams.maxPrice}
          placeholder="Max price"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
      </form>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          Failed to load properties.
        </p>
      )}

      {!error && (!properties || properties.length === 0) && (
        <p className="text-sm text-neutral-500">
          No properties found. Try adjusting your filters.
        </p>
      )}

      <section className="grid gap-5 md:grid-cols-3">
        {properties?.map((property: any) => {
          const primaryImage =
            property.property_images?.find((img: any) => img.is_primary) ??
            property.property_images?.[0];

          return (
            <a
              key={property.id}
              href={`/properties/${property.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-40 w-full bg-neutral-100">
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImage.image_url}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="line-clamp-1 text-sm font-semibold">
                    {property.title}
                  </h2>
                  <span className="text-sm font-semibold text-blue-700">
                    ₹{Number(property.price).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{property.city}</p>
                <div className="mt-auto flex items-center justify-between text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                    {property.property_type}
                  </span>
                  <span>
                    {property.bedrooms ?? "-"} bd · {property.bathrooms ?? "-"} ba
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </section>
    </main>
  );
}
