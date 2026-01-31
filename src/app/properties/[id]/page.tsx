import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { HomeHeader } from "@/src/components/layout/home-header";
import { InquiryForm } from "./inquiry-form";
import { MessageAgentButton } from "./message-agent-button";

type PropertyDetail = {
  id: string;
  title: string;
  city: string;
  price: number;
  property_type: string;
  agent_id: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  description?: string;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const highlights = [
  "Private Pool",
  "Central Air",
  "EV Charging",
  "Gym",
  "Wine Cellar",
  "Smart Security",
];

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id,title,city,price,property_type,agent_id,bedrooms,bathrooms,area_sqft,description,property_images(image_url,is_primary)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div
        className="min-h-screen bg-neutral-950 text-white"
      >
        <HomeHeader />

        <div className={`${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}>
          <main className="mx-auto w-full max-w-6xl px-6 py-12">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h1 className="text-2xl font-semibold">Unable to load property</h1>
              <p className="mt-3 text-sm text-neutral-300">{error.message}</p>
              <p className="mt-2 text-xs text-neutral-400">
                Check RLS policies and ensure the property exists in Supabase.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition hover:border-white/40 hover:bg-white/5"
              >
                Browse listings
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div
        className="min-h-screen bg-neutral-950 text-white"
      >
        <HomeHeader />

        <div className={`${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}>
          <main className="mx-auto w-full max-w-6xl px-6 py-12">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h1 className="text-2xl font-semibold">Property not found</h1>
              <p className="mt-3 text-sm text-neutral-300">
                We couldn&#39;t find a listing for this property.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition hover:border-white/40 hover:bg-white/5"
              >
                Browse listings
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const typedProperty = property as PropertyDetail;
  const price = Number(typedProperty.price);
  const formattedPrice = Number.isFinite(price)
    ? price.toLocaleString()
    : String(typedProperty.price);

  const galleryImages = (typedProperty.property_images ?? [])
    .map((img) => img.image_url)
    .filter((img): img is string => Boolean(img));

  const gallerySlots = Array.from({ length: 5 }, (_, index) => {
    return galleryImages[index] ?? null;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main
        className={`relative mx-auto w-full max-w-6xl px-6 pb-16 pt-6 ${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}
      >
        <div className="text-xs text-neutral-400">
          Home / Buy / <span className="text-white/90">{typedProperty.city}</span>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[2.2fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {gallerySlots[0] ? (
              <div
                className="h-72 w-full bg-cover bg-center md:h-[420px]"
                style={{ backgroundImage: `url(${gallerySlots[0]})` }}
              />
            ) : (
              <div className="h-72 w-full bg-white/5 md:h-[420px]" />
            )}
            <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Featured
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {gallerySlots.slice(1).map((imageUrl, index) => (
              <div
                key={`${typedProperty.id}-gallery-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                {imageUrl ? (
                  <div
                    className="h-36 w-full bg-cover bg-center md:h-[200px]"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ) : (
                  <div className="h-36 w-full bg-white/5 md:h-[200px]" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl font-[var(--font-display)]">
                ${formattedPrice}
              </h1>
              <p className="text-sm text-neutral-300">{typedProperty.title}</p>
              <p className="text-sm text-neutral-400">{typedProperty.city}</p>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-neutral-400 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                >
                  <path d="M3 10h18" />
                  <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                  <path d="M5 20v-6h14v6" />
                </svg>
                {typedProperty.bedrooms ?? "-"} Beds
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                >
                  <path d="M9 6h6" />
                  <path d="M7 6h10l1 6H6l1-6z" />
                  <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                </svg>
                {typedProperty.bathrooms ?? "-"} Baths
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path d="M4 12h16" />
                  <path d="M12 4v16" />
                </svg>
                {typedProperty.area_sqft
                  ? `${typedProperty.area_sqft.toLocaleString()} Sqft`
                  : "- Sqft"}
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                >
                  <path d="M3 11l9-7 9 7" />
                  <path d="M9 22V12h6v10" />
                </svg>
                2 Garage
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-[var(--font-display)]">
                About this home
              </h2>
              <p className="text-sm leading-relaxed text-neutral-400">
                {typedProperty.description ??
                  "Experience refined living with thoughtful finishes, expansive entertaining spaces, and a seamless indoor-outdoor flow designed for modern comfort."}
              </p>
              <button className="text-xs font-semibold text-neutral-300 transition hover:text-white">
                Read more
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-[var(--font-display)]">Highlights</h3>
              <div className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-500/20 text-neutral-200">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-[var(--font-display)]">Location</h3>
              <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {typedProperty.city}
                </div>
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-500 shadow-[0_0_16px_rgba(163,163,163,0.6)]" />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/10" />
                <div>
                  <p className="text-xs text-neutral-400">Listed by</p>
                  <p className="text-sm font-semibold">Luxe Estates</p>
                  <p className="text-xs text-neutral-400">DRE-01234567</p>
                </div>
              </div>

              <div className="mt-5">
                <MessageAgentButton
                  propertyId={typedProperty.id}
                  agentId={typedProperty.agent_id}
                />
                <InquiryForm
                  propertyId={typedProperty.id}
                  propertyTitle={typedProperty.title}
                />
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}


