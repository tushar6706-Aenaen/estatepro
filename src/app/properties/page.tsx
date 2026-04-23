import Link from "next/link";

import { HomeHeader } from "@/src/components/layout/home-header";
import { PropertyCard } from "@/src/components/property-card";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  EditorialPill,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { resolveStorageImageUrl } from "@/src/lib/supabase/resolve-storage-image-url";

type PropertyListItem = {
  id: string;
  title: string;
  city: string;
  price: number | string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

function getPrimaryImage(listing: PropertyListItem) {
  const raw =
    listing.property_images?.find((img) => img.is_primary)?.image_url ??
    listing.property_images?.[0]?.image_url;
  return resolveStorageImageUrl(raw) ?? undefined;
}

export default async function PropertiesPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,title,city,price,property_type,bedrooms,bathrooms,area_sqft,property_images(image_url,is_primary)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(120);

  const properties = ((data ?? []) as PropertyListItem[]).map((item) => ({
    ...item,
    imageUrl: getPrimaryImage(item),
  }));

  return (
    <div className={`${editorialPageRootClass} bg-[#f2eee3] pb-20 md:pb-0`}>
      <div className="relative isolate overflow-hidden">
        <EditorialBackdrop
          radialClassName="absolute inset-0 left-0 w-full translate-x-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.1),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(234,88,12,0.1),transparent_45%)]"
          gridClassName="absolute inset-0 left-0 w-full translate-x-0 opacity-[0.08]"
        />
        <HomeHeader />

        <main className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <EditorialCard className="rounded-[1.6rem] bg-white/80 p-5 shadow-none md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Property Index
                </p>
                <h1 className="mt-2 font-serif text-3xl text-zinc-950 md:text-4xl">
                  All Approved Properties
                </h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Browse the full listing catalog in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <EditorialPill tone="soft" className="py-1.5 font-medium">
                  {properties.length} loaded
                </EditorialPill>
                <Link
                  href="/"
                  className="rounded-full border border-zinc-900/15 bg-[#f8f3e7] px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900/25 hover:bg-[#f1ead8]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </EditorialCard>

          {error && (
            <EditorialNotice tone="error" className="mt-5">
              {error.message}
            </EditorialNotice>
          )}

          {!error && properties.length === 0 && (
            <EditorialNotice className="mt-5 border-zinc-200 bg-white px-8 py-12 text-center text-zinc-600">
              No approved properties found.
            </EditorialNotice>
          )}

          {!error && properties.length > 0 && (
            <section className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((listing, index) => {
                const isNew = index < 6;
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
                    badge="Approved"
                    imageUrl={listing.imageUrl}
                    index={index}
                    isNew={isNew}
                    priceChange={priceChange}
                    priceChangePercent={priceChangePercent}
                  />
                );
              })}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
