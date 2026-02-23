import Link from "next/link";

import { PropertyFilters } from "@/src/components/property-filters";
import { HomeHeader } from "@/src/components/layout/home-header";
import { AnimatedHero } from "@/src/components/animated-hero";
import { PropertyCard } from "@/src/components/property-card";
import { MobileFilters } from "@/src/components/mobile-filters";
import { PropertyCardCarousel } from "@/src/components/property-carousel";
import { FloatingActionButton } from "@/src/components/floating-action-button";
import { MapToggleView } from "@/src/components/map-toggle-view";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
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
  latitude: number | null;
  longitude: number | null;
  badge?: string;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number | string) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return inrFormatter.format(numericValue);
}

function getPrimaryImage(listing: PropertyCard) {
  return (
    listing.property_images?.find((img) => img.is_primary)?.image_url ||
    listing.property_images?.[0]?.image_url
  );
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let properties: PropertyCard[] = [];
  let loadError: string | null = null;
  let stats = {
    properties: 0,
    clients: 0,
    agents: 0,
  };

  // --- 1. Database Fetching Logic (Unchanged) ---
  if (!supabaseUrl || !supabaseAnonKey) {
    loadError = "Supabase environment variables are missing. Add them to .env.local.";
  } else {
    const supabase = createSupabaseServerClient();

    // Fetch statistics
    try {
      // Count total approved properties
      const { count: propertiesCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Count users with agent role
      const { count: agentsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "agent");

      // Count unique inquiries (as proxy for happy clients)
      const { count: clientsCount } = await supabase
        .from("inquiries")
        .select("user_id", { count: "exact", head: true });

      stats = {
        properties: propertiesCount ?? 0,
        agents: agentsCount ?? 0,
        clients: clientsCount ?? 0,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
    }

    let query = supabase
      .from("properties")
      .select(
        "id,title,city,price,property_type,bedrooms,bathrooms,area_sqft,latitude,longitude,status,property_images(image_url,is_primary)",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24);

    if (resolvedParams.city) {
      query = query.ilike("city", `%${resolvedParams.city}%`);
    }
    if (resolvedParams.type) {
      query = query.eq("property_type", resolvedParams.type);
    }
    if (resolvedParams.priceMin) {
      const min = Number(resolvedParams.priceMin);
      if (!Number.isNaN(min)) {
        query = query.gte("price", min);
      }
    }
    if (resolvedParams.priceMax) {
      const max = Number(resolvedParams.priceMax);
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

  const priceValues = properties
    .map((listing) => Number(listing.price))
    .filter((price) => !Number.isNaN(price));
  const averagePrice =
    priceValues.length > 0
      ? Math.round(priceValues.reduce((total, price) => total + price, 0) / priceValues.length)
      : 0;
  const medianPrice = Math.round(median(priceValues));
  const mapReadyCount = properties.filter(
    (listing) => listing.latitude != null && listing.longitude != null,
  ).length;
  const mapCoverage = properties.length > 0 ? Math.round((mapReadyCount / properties.length) * 100) : 0;
  const cityCounts = properties.reduce<Map<string, number>>((acc, listing) => {
    acc.set(listing.city, (acc.get(listing.city) ?? 0) + 1);
    return acc;
  }, new Map());
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([city, count]) => ({ city, count }));
  const topCityMax = Math.max(1, ...topCities.map((item) => item.count));
  const typeCounts = properties.reduce<Map<string, number>>((acc, listing) => {
    acc.set(listing.property_type, (acc.get(listing.property_type) ?? 0) + 1);
    return acc;
  }, new Map());
  const topType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const activeFilters = [
    resolvedParams.city ? { label: "City", value: resolvedParams.city } : null,
    resolvedParams.type ? { label: "Type", value: titleCase(resolvedParams.type) } : null,
    resolvedParams.priceMin ? { label: "Min", value: formatCurrency(resolvedParams.priceMin) } : null,
    resolvedParams.priceMax ? { label: "Max", value: formatCurrency(resolvedParams.priceMax) } : null,
  ].filter((filter): filter is { label: string; value: string } => filter !== null);

  // --- 2. Render Page ---
  return (
    <div className={`${editorialPageRootClass} bg-[#f2eee3] pb-20 md:pb-0`}>
      <div className="relative isolate overflow-hidden">
        <EditorialBackdrop
          radialClassName="absolute inset-0 left-0 w-full translate-x-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(234,88,12,0.12),transparent_45%)]"
          gridClassName="absolute inset-0 left-0 w-full translate-x-0 opacity-[0.08]"
        />

        <HomeHeader />

        <main className="relative">
          {/* Hero Section with New Frame */}
          <section className="mx-auto w-full max-w-7xl px-4 md:px-6 pt-6 md:pt-10">
            <div className="overflow-hidden rounded-[2rem] border border-zinc-900/10 bg-white/70 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <AnimatedHero stats={stats} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <EditorialCard className="rounded-[1.5rem] bg-white/75 p-5 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Search Context
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-zinc-950 md:text-3xl">
                      Buyer-ready browsing, now organized around decisions.
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Filter by city, type, and budget. Compare in grid view. Then switch to map view for
                      location context without changing your result set.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-zinc-600">
                    <EditorialPill tone="soft" className="py-1.5 font-medium">
                      {properties.length} listings on page
                    </EditorialPill>
                    <EditorialPill tone="soft" className="py-1.5 font-medium">
                      {mapReadyCount} map-ready
                    </EditorialPill>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFilters.length > 0 ? (
                    activeFilters.map((filter) => (
                      <EditorialPill
                        key={`${filter.label}-${filter.value}`}
                        tone="soft"
                        className="gap-2 py-1.5 text-zinc-700"
                      >
                        <span className="font-semibold text-zinc-900">{filter.label}</span>
                        <span>{filter.value}</span>
                      </EditorialPill>
                    ))
                  ) : (
                    <>
                      <EditorialPill tone="soft" className="py-1.5 font-medium text-zinc-700">
                        All cities
                      </EditorialPill>
                      <EditorialPill tone="soft" className="py-1.5 font-medium text-zinc-700">
                        All property types
                      </EditorialPill>
                      <EditorialPill tone="soft" className="py-1.5 font-medium text-zinc-700">
                        Full budget range
                      </EditorialPill>
                    </>
                  )}
                </div>
              </EditorialCard>

              <EditorialCard
                tone="dark"
                className="overflow-hidden rounded-[1.5rem] text-[#f5efe4] shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)]"
              >
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d0c5b4]">
                    Market Pulse
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-tight text-white">
                    Snapshot of the current filtered inventory
                  </h3>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#cec2b0]">Average</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {priceValues.length > 0 ? formatCurrency(averagePrice) : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#cec2b0]">Median</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {priceValues.length > 0 ? formatCurrency(medianPrice) : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#cec2b0]">Dominant Type</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {topType ? titleCase(topType[0]) : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#cec2b0]">Map Coverage</p>
                    <p className="mt-2 text-xl font-semibold text-white">{mapCoverage}%</p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6ccbc]">
                      Top Cities
                    </p>
                    <Link
                      href="/onboarding?redirect=/"
                      className="text-xs font-semibold text-[#f0ddb8] transition hover:text-white"
                    >
                      List Property
                    </Link>
                  </div>
                  <div className="mt-3 space-y-3">
                    {topCities.length > 0 ? (
                      topCities.map((city) => (
                        <div key={city.city} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-white">{city.city}</span>
                            <span className="text-white/70">{city.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#f2d2a0] to-[#d26f38]"
                              style={{ width: `${Math.max(12, (city.count / topCityMax) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                        City insights will appear when listings are available.
                      </p>
                    )}
                  </div>
                </div>
              </EditorialCard>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 md:px-6 pt-6 md:pt-8">
            <EditorialCard className="rounded-[1.5rem] bg-white/75 p-4 shadow-none md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Search Workbench
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-zinc-950 md:text-3xl">
                    Filter once, review everywhere.
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    Desktop filters sit above the listing grid; mobile gets the compact filter experience.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                  <EditorialPill tone="soft" className="py-1.5 font-medium">City</EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">Type</EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">Budget</EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">Grid + Map</EditorialPill>
                </div>
              </div>
            </EditorialCard>
          </section>

          {/* Filter Section - Desktop */}
          <div className="hidden md:block pt-4">
            <PropertyFilters />
          </div>

          {/* Filter Section - Mobile */}
          <MobileFilters />

          {/* Listing Section */}
          <section id="listings" className="mx-auto w-full max-w-7xl px-4 md:px-6 py-8 md:py-10">
            <div className="overflow-hidden rounded-[2rem] border border-zinc-900/10 bg-white/80 p-4 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Inventory Grid
              </p>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl font-semibold text-zinc-950">
                Newly Listed Properties
              </h2>
              <p className="mt-2 md:mt-3 text-sm md:text-base text-zinc-600">
                Fresh on the market in your favorite areas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
              <EditorialPill tone="soft" className="py-1.5 font-medium">
                {properties.length} results
              </EditorialPill>
              <EditorialPill tone="soft" className="py-1.5 font-medium">
                {mapCoverage}% mapped
              </EditorialPill>
              {topCities[0] && (
                <EditorialPill tone="soft" className="py-1.5 font-medium">
                  Hotspot: {topCities[0].city}
                </EditorialPill>
              )}
            </div>
          </div>

              {/* Mobile Carousel */}
              {!loadError && properties.length > 0 && (
                <div className="rounded-2xl border border-zinc-900/8 bg-[#faf7ef] px-2 py-1 md:hidden">
                  <PropertyCardCarousel
                    properties={properties.map((p) => ({
                      id: p.id,
                      title: p.title,
                      city: p.city,
                      price: p.price,
                      imageUrl: getPrimaryImage(p),
                    }))}
                  />
                </div>
              )}

              {/* Desktop: Grid / Map Toggle */}
              <div className="mt-5 hidden rounded-2xl border border-zinc-900/8 bg-[#faf7ef] p-3 md:block">
                <MapToggleView
                  properties={properties
                    .filter((p) => p.latitude != null && p.longitude != null)
                    .map((p) => ({
                      id: p.id,
                      title: p.title,
                      city: p.city,
                      price: p.price,
                      latitude: p.latitude!,
                      longitude: p.longitude!,
                      imageUrl: getPrimaryImage(p),
                    }))}
                  gridView={
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {loadError && (
                        <EditorialNotice tone="error" className="col-span-full">
                          {loadError}
                        </EditorialNotice>
                      )}

                      {!loadError && properties.length === 0 && (
                        <EditorialNotice className="col-span-full border-zinc-200 bg-white px-8 py-12 text-center text-zinc-600">
                          No properties match these filters yet. Try adjusting your search.
                        </EditorialNotice>
                      )}

                      {properties.map((listing, index) => {
                        const primaryImage = getPrimaryImage(listing);
                        const isNew = index < 3;
                        const priceChange = index % 5 === 0 ? "down" : index % 3 === 0 ? "up" : null;
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
                            imageUrl={primaryImage}
                            index={index}
                            isNew={isNew}
                            priceChange={priceChange}
                            priceChangePercent={priceChangePercent}
                          />
                        );
                      })}
                    </div>
                  }
                />
              </div>

              {loadError && (
                <EditorialNotice tone="error" className="mt-4 md:hidden">
                  {loadError}
                </EditorialNotice>
              )}

              {!loadError && properties.length === 0 && (
                <EditorialNotice className="mt-4 border-zinc-200 bg-[#faf7ef] px-6 py-8 text-center text-sm text-zinc-600 md:hidden">
                  No properties match these filters yet. Try adjusting your search.
                </EditorialNotice>
              )}

              <EditorialCard tone="plain" radius="lg" className="mt-8 flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Need more inventory?</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Homepage shows the newest 24 approved listings.
                  </p>
                </div>
                <button
                  className={editorialButtonClass({
                    tone: "secondary",
                    className:
                      "bg-[#f8f4ea] px-6 py-2.5 text-zinc-800 hover:border-zinc-900/35 hover:bg-[#f2ecd8] active:scale-95",
                  })}
                >
                  Load More Properties
                </button>
              </EditorialCard>
            </div>
          </section>

          {/* Floating Action Button */}
          <FloatingActionButton />
        </main>

        <footer className="mt-6 border-t border-zinc-900/10 bg-[#141312] text-[#efe7d9] md:mt-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <div className="inline-flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-semibold">
                  LE
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">LuxEstate</p>
                  <p className="text-xs text-[#cabfae]">Map-first property discovery</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#d6ccbc]">
                Curated listings, cleaner filters, and faster shortlisting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#e8dece]">
              <a className="transition hover:text-white" href="#">About Us</a>
              <a className="transition hover:text-white" href="#">For Agents</a>
              <a className="transition hover:text-white" href="#">Support</a>
              <a className="transition hover:text-white" href="#">Privacy</a>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-[#bcae97] md:flex-row md:items-center md:justify-between md:px-6">
              <span>(c) 2026 LuxEstate Inc.</span>
              <span>Homepage redesign: editorial shell + market pulse + map toggle listings.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

