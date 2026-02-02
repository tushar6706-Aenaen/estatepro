import { PropertyFilters } from "@/src/components/property-filters"; 
import { HomeHeader } from "@/src/components/layout/home-header";
import { AnimatedHero } from "@/src/components/animated-hero";
import { PropertyCard } from "@/src/components/property-card";
import { MobileFilters } from "@/src/components/mobile-filters";
import { PropertyCardCarousel } from "@/src/components/property-carousel";
import { FloatingActionButton } from "@/src/components/floating-action-button";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type SearchParams = {
  city?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  q?: string;
};

type PropertyCard = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  badge?: string;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let properties: PropertyCard[] = [];
  let loadError: string | null = null;

  // --- 1. Database Fetching Logic (Unchanged) ---
  if (!supabaseUrl || !supabaseAnonKey) {
    loadError = "Supabase environment variables are missing. Add them to .env.local.";
  } else {
    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("properties")
      .select(
        "id,title,city,price,property_type,bedrooms,bathrooms,area_sqft,status,property_images(image_url,is_primary)",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24);

    if (searchParams.city) {
      query = query.ilike("city", `%${searchParams.city}%`);
    }
    if (searchParams.type) {
      query = query.eq("property_type", searchParams.type);
    }
    if (searchParams.priceMin) {
      const min = Number(searchParams.priceMin);
      if (!Number.isNaN(min)) {
        query = query.gte("price", min);
      }
    }
    if (searchParams.priceMax) {
      const max = Number(searchParams.priceMax);
      if (!Number.isNaN(max)) {
        query = query.lte("price", max);
      }
    }

    const { data, error } = await query;
    if (error) {
      loadError = error.message;
    } else if (data) {
      properties = data.map((p) => ({
        ...p,
        badge: p.property_type === "commercial" ? "Featured" : "For Sale",
      }));
    }
  }

  // --- 2. Render Page ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      <HomeHeader />

      <main>
        {/* Hero Section with Animations */}
        <AnimatedHero />

        {/* Filter Section - Desktop */}
        <div className="hidden md:block">
          <PropertyFilters />
        </div>

        {/* Filter Section - Mobile */}
        <MobileFilters />

        {/* Section Divider */}
        <div className="section-divider my-16" />

        {/* Listing Section */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">
                Newly Listed Properties
              </h2>
              <p className="mt-3 text-base text-gray-600">
                Fresh on the market in your favorite areas.
              </p>
            </div>
            <button className="hidden md:block text-sm font-semibold text-gray-700 transition hover:text-gray-900">
              View All
            </button>
          </div>

          {/* Mobile Carousel */}
          {!loadError && properties.length > 0 && (
            <PropertyCardCarousel
              properties={properties.map((p) => ({
                id: p.id,
                title: p.title,
                city: p.city,
                price: p.price,
                imageUrl: p.property_images?.find((img) => img.is_primary)?.image_url ||
                         p.property_images?.[0]?.image_url,
              }))}
            />
          )}

          {/* Desktop Grid */}
          <div className="hidden md:grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loadError && (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {!loadError && properties.length === 0 && (
              <div className="col-span-full rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center text-gray-500">
                No properties match these filters yet. Try adjusting your search.
              </div>
            )}

            {properties.map((listing, index) => {
              const primaryImage =
                listing.property_images?.find((img) => img.is_primary) ||
                listing.property_images?.[0];

              // Simulate "New" badge for recently created listings (last 3 days)
              const isNew = index < 3; // Mock: first 3 are "new"
              
              // Simulate price changes
              const priceChange = index % 5 === 0 ? "down" : index % 3 === 0 ? "up" : null;
              // Deterministic pseudo-random percentage to avoid impure Math.random in render
              const hashSource = `${listing.id}-${listing.title}-${index}`;
              let hash = 0;
              for (let i = 0; i < hashSource.length; i += 1) {
                hash = (hash << 5) - hash + hashSource.charCodeAt(i);
                hash |= 0;
              }
              const priceChangePercent = priceChange ? (Math.abs(hash) % 10) + 1 : 0;

              return (
                <PropertyCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  city={listing.city}
                  price={listing.price}
                  property_type={listing.property_type}
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  area_sqft={listing.area_sqft}
                  badge={listing.badge}
                  imageUrl={primaryImage?.image_url}
                  index={index}
                  isNew={isNew}
                  priceChange={priceChange}
                  priceChangePercent={priceChangePercent}
                />
              );
            })}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="rounded-full border-2 border-gray-300 bg-white px-10 py-4 md:px-8 md:py-4 text-base md:text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-400 active:scale-95">
              Load More Properties
            </button>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider my-20" />

        {/* Floating Action Button */}
        <FloatingActionButton />
      </main>

      <footer className="border-t border-gray-300 bg-white mt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              *
            </span>
            <span>(c) 2023 LuxEstate Inc.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <a className="transition hover:text-gray-900" href="#">About Us</a>
            <a className="transition hover:text-gray-900" href="#">For Agents</a>
            <a className="transition hover:text-gray-900" href="#">Support</a>
            <a className="transition hover:text-gray-900" href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
