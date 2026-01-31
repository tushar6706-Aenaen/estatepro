import Link from "next/link";

import { HomeHeader } from "@/src/components/layout/home-header";
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

  const priceRanges = [
    { label: "Any", min: "", max: "" },
    { label: "Under $500k", min: "", max: "500000" },
    { label: "$500k - $1M", min: "500000", max: "1000000" },
    { label: "$1M - $2M", min: "1000000", max: "2000000" },
    { label: "$2M+", min: "2000000", max: "" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/landing_page.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-neutral-950/70" />
          <div className="relative mx-auto grid min-h-[520px] w-full max-w-6xl items-center px-6 py-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300">
                Premium listings
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Find Your Dream Home
              </h1>
              <p className="max-w-2xl text-base text-neutral-300">
                Discover luxury properties in exclusive locations tailored to your
                lifestyle.
              </p>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.9)] md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-neutral-950/60 px-4 py-3 text-sm text-neutral-300">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400"
                  >
                    <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter an address, neighborhood, city, or ZIP"
                    className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
                  />
                </div>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-neutral-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-24px_rgba(0,0,0,0.8)] transition hover:bg-neutral-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-neutral-950">
          <form
            className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-5 text-sm"
            method="get"
          >
            <input
              name="city"
              defaultValue={searchParams.city ?? ""}
              placeholder="City"
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none sm:w-40"
            />

            <div className="relative w-full sm:w-44">
              <select
                name="type"
                defaultValue={searchParams.type ?? ""}
                className="w-full appearance-none rounded-full border border-white/10 bg-neutral-950 px-4 py-2 pr-10 text-sm text-neutral-200 outline-none [color-scheme:dark] focus:border-white/30"
              >
                <option className="bg-neutral-950 text-white" value="">
                  Property Type
                </option>
                <option className="bg-neutral-950 text-white" value="apartment">
                  Apartment
                </option>
                <option className="bg-neutral-950 text-white" value="house">
                  House
                </option>
                <option className="bg-neutral-950 text-white" value="land">
                  Land
                </option>
                <option className="bg-neutral-950 text-white" value="commercial">
                  Commercial
                </option>
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <div className="relative w-full sm:w-40">
              <select
                name="priceMin"
                defaultValue={searchParams.priceMin ?? ""}
                className="w-full appearance-none rounded-full border border-white/10 bg-neutral-950 px-4 py-2 pr-10 text-sm text-neutral-200 outline-none [color-scheme:dark] focus:border-white/30"
              >
                <option className="bg-neutral-950 text-white" value="">
                  Min Price
                </option>
                {priceRanges.map(
                  (r) =>
                    r.min && (
                      <option className="bg-neutral-950 text-white" key={r.label} value={r.min}>
                        {r.label}
                      </option>
                    ),
                )}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <div className="relative w-full sm:w-40">
              <select
                name="priceMax"
                defaultValue={searchParams.priceMax ?? ""}
                className="w-full appearance-none rounded-full border border-white/10 bg-neutral-950 px-4 py-2 pr-10 text-sm text-neutral-200 outline-none [color-scheme:dark] focus:border-white/30"
              >
                <option className="bg-neutral-950 text-white" value="">
                  Max Price
                </option>
                {priceRanges.map(
                  (r) =>
                    r.max && (
                      <option className="bg-neutral-950 text-white" key={r.label} value={r.max}>
                        {r.label}
                      </option>
                    ),
                )}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-neutral-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-400 sm:w-auto">
              Apply Filters
            </button>

            <Link
              href="/"
              className="text-sm font-semibold text-neutral-400 hover:text-white"
            >
              Reset
            </Link>
          </form>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Newly Listed Properties
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                Fresh on the market in your favorite areas.
              </p>
            </div>
            <button className="text-sm font-semibold text-neutral-300 transition hover:text-neutral-200">
              View All
            </button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadError && (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {!loadError && properties.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-neutral-300">
                No properties match these filters yet.
              </div>
            )}

            {properties.map((listing) => {
              const primaryImage =
                listing.property_images?.find((img) => img.is_primary) ||
                listing.property_images?.[0];

              return (
                <Link
                  key={listing.id}
                  href={`/properties/${listing.id}`}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.8)] transition hover:border-white/20"
                >
                  <div
                    className="relative h-44 bg-neutral-800"
                    style={
                      primaryImage?.image_url
                        ? {
                            backgroundImage: `url(${primaryImage.image_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    <div className="absolute left-4 top-4 rounded-full bg-neutral-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      {listing.badge ?? "For Sale"}
                    </div>
                    <button className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white/25">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.8 8.6a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 6 8 10.4 8 10.4s8-4.4 8-10.4z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
                      ${Number(listing.price).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3 px-5 py-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-neutral-400">{listing.city}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-70"
                        >
                          <path d="M3 10h18" />
                          <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                          <path d="M5 20v-6h14v6" />
                        </svg>
                        {listing.bedrooms ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-70"
                        >
                          <path d="M9 6h6" />
                          <path d="M7 6h10l1 6H6l1-6z" />
                          <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                        </svg>
                        {listing.bathrooms ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-70"
                        >
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <path d="M4 12h16" />
                          <path d="M12 4v16" />
                        </svg>
                        {listing.area_sqft ? `${listing.area_sqft} sqft` : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white">
              Load More Properties
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-neutral-950/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-300">
              *
            </span>
            <span>(c) 2023 LuxEstate Inc.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-neutral-400">
            <a className="transition hover:text-white" href="#">
              About Us
            </a>
            <a className="transition hover:text-white" href="#">
              For Agents
            </a>
            <a className="transition hover:text-white" href="#">
              Support
            </a>
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
