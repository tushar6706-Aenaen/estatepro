import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { HomeHeader } from "@/src/components/layout/home-header";
import { PropertyMap } from "@/src/components/map";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
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
  latitude?: number;
  longitude?: number;
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

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return priceFormatter.format(value);
}

function hasCoordinates(
  property: Pick<PropertyDetail, "latitude" | "longitude">,
): property is PropertyDetail & { latitude: number; longitude: number } {
  return property.latitude != null && property.longitude != null;
}

function formatCoordinate(value: number | undefined) {
  if (value == null) {
    return "N/A";
  }

  return value.toFixed(5);
}

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
      "id,title,city,price,property_type,agent_id,bedrooms,bathrooms,area_sqft,description,latitude,longitude,property_images(image_url,is_primary)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className={editorialPageRootClass}>
        <HomeHeader />

        <div className={`${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}>
          <main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
            <EditorialCard className="rounded-[1.75rem] p-8 text-center md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Property Dossier
              </p>
              <h1 className="mt-3 text-2xl font-semibold font-[var(--font-display)] text-zinc-950 md:text-3xl">
                Unable to load property
              </h1>
              <p className="mt-3 text-sm text-zinc-700">{error.message}</p>
              <p className="mt-2 text-xs text-zinc-600">
                Check RLS policies and ensure the property exists in Supabase.
              </p>
              <Link
                href="/"
                className={editorialButtonClass({
                  tone: "secondary",
                  className:
                    "mt-6 bg-[#f8f3e7] px-5 py-2.5 text-zinc-900 hover:border-zinc-900/30 hover:bg-[#f1ead8]",
                })}
              >
                Browse listings
              </Link>
            </EditorialCard>
          </main>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={editorialPageRootClass}>
        <HomeHeader />

        <div className={`${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}>
          <main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
            <EditorialCard className="rounded-[1.75rem] p-8 text-center md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Property Dossier
              </p>
              <h1 className="mt-3 text-2xl font-semibold font-[var(--font-display)] text-zinc-950 md:text-3xl">
                Property not found
              </h1>
              <p className="mt-3 text-sm text-zinc-700">
                We couldn&#39;t find a listing for this property.
              </p>
              <Link
                href="/"
                className={editorialButtonClass({
                  tone: "secondary",
                  className:
                    "mt-6 bg-[#f8f3e7] px-5 py-2.5 text-zinc-900 hover:border-zinc-900/30 hover:bg-[#f1ead8]",
                })}
              >
                Browse listings
              </Link>
            </EditorialCard>
          </main>
        </div>
      </div>
    );
  }

  const typedProperty = property as PropertyDetail;
  const price = Number(typedProperty.price);
  const formattedPrice = Number.isFinite(price)
    ? formatCurrency(price)
    : String(typedProperty.price);
  const hasMapCoordinates = hasCoordinates(typedProperty);

  const galleryImages = (typedProperty.property_images ?? [])
    .map((img) => img.image_url)
    .filter((img): img is string => Boolean(img));

  const gallerySlots = Array.from({ length: 5 }, (_, index) => {
    return galleryImages[index] ?? null;
  });

  const pricePerSqft =
    Number.isFinite(price) && typedProperty.area_sqft && typedProperty.area_sqft > 0
      ? Math.round(price / typedProperty.area_sqft)
      : null;
  const formattedPropertyType = typedProperty.property_type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const narrative =
    typedProperty.description ??
    "No property description has been added by the agent yet.";
  const snapshotItems = [
    {
      label: "Property Type",
      value: formattedPropertyType,
    },
    {
      label: "Bedrooms",
      value: typedProperty.bedrooms != null ? `${typedProperty.bedrooms}` : "N/A",
    },
    {
      label: "Bathrooms",
      value: typedProperty.bathrooms != null ? `${typedProperty.bathrooms}` : "N/A",
    },
    {
      label: "Area",
      value: typedProperty.area_sqft
        ? `${typedProperty.area_sqft.toLocaleString()} sqft`
        : "Not provided",
    },
    {
      label: "Photos Uploaded",
      value: `${galleryImages.length}`,
    },
    {
      label: "Map Coordinates",
      value: hasMapCoordinates ? "Provided" : "Not provided",
    },
    {
      label: "Price / sqft",
      value: pricePerSqft ? formatCurrency(pricePerSqft) : "Unavailable",
    },
    {
      label: "City",
      value: typedProperty.city || "N/A",
    },
  ];
  const detailCards = [
    {
      label: "Bedrooms",
      value: typedProperty.bedrooms != null ? `${typedProperty.bedrooms}` : "N/A",
      icon: (
        <>
          <path d="M3 10h18" />
          <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
          <path d="M5 20v-6h14v6" />
        </>
      ),
    },
    {
      label: "Bathrooms",
      value: typedProperty.bathrooms != null ? `${typedProperty.bathrooms}` : "N/A",
      icon: (
        <>
          <path d="M9 6h6" />
          <path d="M7 6h10l1 6H6l1-6z" />
          <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
        </>
      ),
    },
    {
      label: "Area",
      value: typedProperty.area_sqft ? `${typedProperty.area_sqft.toLocaleString()} sqft` : "N/A",
      icon: (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 12h16" />
          <path d="M12 4v16" />
        </>
      ),
    },
    {
      label: "Type",
      value: formattedPropertyType,
      icon: (
        <>
          <path d="M3 11l9-7 9 7" />
          <path d="M9 22V12h6v10" />
        </>
      ),
    },
  ];

  return (
    <div className={editorialPageRootClass}>
      <HomeHeader />

      <main
        className={`relative isolate mx-auto w-full max-w-7xl px-4 md:px-6 pb-16 pt-4 md:pt-6 ${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)]`}
      >
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.1),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(234,88,12,0.12),transparent_40%)]"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] md:text-xs">
            <EditorialPill className="bg-white/80 py-1.5 text-zinc-600 backdrop-blur-sm">
              Home / Properties / <span className="font-semibold text-zinc-900">{typedProperty.city}</span>
            </EditorialPill>
            <div className="flex flex-wrap gap-2 text-zinc-700">
              <EditorialPill tone="soft" className="py-1.5 font-medium">
                {galleryImages.length} photos
              </EditorialPill>
              <EditorialPill tone="soft" className="py-1.5 font-medium">
                {hasMapCoordinates ? "Map-enabled" : "Map pending"}
              </EditorialPill>
            </div>
          </div>

          <EditorialCard className="mt-4 bg-white/80 p-5 shadow-[0_22px_75px_-55px_rgba(0,0,0,0.45)] md:p-6">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <EditorialPill className="border-emerald-700/20 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800 md:text-xs">
                    Active Listing
                  </EditorialPill>
                  <EditorialPill tone="soft" className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] md:text-xs">
                    {detailCards.find((card) => card.label === "Type")?.value}
                  </EditorialPill>
                </div>
                <h1 className="mt-4 font-[var(--font-display)] text-3xl leading-tight text-zinc-950 md:text-4xl lg:text-5xl">
                  {typedProperty.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
                  Property details, gallery, location context, and direct agent actions in one buyer-ready
                  page.
                </p>
              </div>

              <EditorialCard
                tone="dark"
                radius="xl"
                className="overflow-hidden rounded-[1.25rem] text-[#f5efe4] shadow-[0_18px_55px_-40px_rgba(0,0,0,0.55)]"
              >
                <div className="border-b border-white/10 px-4 py-3 md:px-5 md:py-4">
                  <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0c5b4]">
                    Price Dossier
                  </p>
                  <p className="mt-2 font-[var(--font-display)] text-3xl leading-none text-white md:text-4xl">
                    {formattedPrice}
                  </p>
                  <p className="mt-2 text-xs text-[#d9ccb7]">
                    {pricePerSqft ? `${formatCurrency(pricePerSqft)} / sqft` : "Price per sqft unavailable"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 md:p-5">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#cdbfa8]">City</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{typedProperty.city}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#cdbfa8]">Coordinates</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {hasMapCoordinates ? "Available" : "Unavailable"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#cdbfa8]">Property ID</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{typedProperty.id}</p>
                  </div>
                </div>
              </EditorialCard>
            </div>
          </EditorialCard>

        <section className="mt-4 md:mt-6 grid gap-3 md:gap-4 lg:grid-cols-[2.2fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-900/10 bg-white shadow-[0_18px_50px_-40px_rgba(0,0,0,0.35)]">
            {gallerySlots[0] ? (
              <div
                className="h-56 sm:h-72 w-full bg-cover bg-center md:h-[420px]"
                style={{ backgroundImage: `url(${gallerySlots[0]})` }}
              />
            ) : (
              <div className="h-56 sm:h-72 w-full bg-[#e7e2d8] md:h-[420px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute left-3 top-3 md:left-4 md:top-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/25 bg-black/35 px-2 md:px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] md:tracking-[0.2em] text-white">
                Featured
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 md:px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] md:tracking-[0.2em] text-white">
                Gallery
              </span>
            </div>
            <div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4 rounded-2xl border border-white/15 bg-black/35 p-3 md:p-4 backdrop-blur">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-white/70">
                Primary view
              </p>
              <p className="mt-1 text-sm md:text-lg font-semibold text-white line-clamp-1">
                {typedProperty.title}
              </p>
              <p className="mt-1 text-xs md:text-sm text-white/75">{typedProperty.city}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {gallerySlots.slice(1).map((imageUrl, index) => (
              <div
                key={`${typedProperty.id}-gallery-${index}`}
                className="overflow-hidden rounded-xl md:rounded-2xl border border-zinc-900/10 bg-white shadow-sm"
              >
                {imageUrl ? (
                  <div
                    className="h-28 sm:h-36 w-full bg-cover bg-center md:h-[200px]"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ) : (
                  <div className="flex h-28 sm:h-36 w-full items-center justify-center bg-[#e7e2d8] text-[10px] md:text-xs text-zinc-500 md:h-[200px]">
                    Empty slot
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 md:mt-10 grid gap-6 md:gap-8 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6 md:space-y-8">
            <EditorialCard className="rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Listing Overview
                  </p>
                  <h2 className="font-[var(--font-display)] text-3xl md:text-4xl lg:text-5xl leading-tight text-zinc-950">
                    {formattedPrice}
                  </h2>
                  <p className="text-sm text-zinc-700">{typedProperty.city}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-700">
                  <EditorialPill tone="soft" className="py-1.5 font-medium">
                    {hasMapCoordinates ? "Map ready" : "Map unavailable"}
                  </EditorialPill>
                  <EditorialPill tone="soft" className="py-1.5 font-medium">
                    {pricePerSqft ? `${formatCurrency(pricePerSqft)} / sqft` : "Price / sqft N/A"}
                  </EditorialPill>
                </div>
              </div>
            </EditorialCard>

            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {detailCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-900/10 bg-white/80 px-4 py-4 text-zinc-700 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8f3e7] text-zinc-700">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {item.icon}
                      </svg>
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <EditorialCard className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold font-[var(--font-display)] text-zinc-950">
                  About this home
                </h2>
                <button
                  className={editorialButtonClass({
                    tone: "secondary",
                    size: "sm",
                    className: "bg-[#f8f3e7] text-xs text-zinc-700 hover:bg-[#f1ead8]",
                  })}
                >
                  Save Listing
                </button>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-700">{narrative}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
                <EditorialPill tone="muted" className="py-1.5 font-medium [overflow-wrap:anywhere]">
                  Property ID: {typedProperty.id}
                </EditorialPill>
                <EditorialPill tone="muted" className="py-1.5 font-medium [overflow-wrap:anywhere]">
                  Agent ID: {typedProperty.agent_id}
                </EditorialPill>
              </div>
            </EditorialCard>

            <EditorialCard className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.35)]">
              <h3 className="text-lg md:text-xl font-semibold font-[var(--font-display)] text-zinc-950">
                Property Snapshot
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Real values from the agent-submitted listing fields. No generated amenities.
              </p>
              <div className="mt-4 grid gap-2 md:gap-3 text-xs md:text-sm text-zinc-700 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {snapshotItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] px-4 py-3 transition hover:border-zinc-900/20 hover:bg-white"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-800 shadow-sm">
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
                        <path d="M12 3v18" />
                        <path d="M3 12h18" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block break-words font-medium text-zinc-900">
                        {item.value}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </EditorialCard>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <EditorialCard className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.35)]">
                <h3 className="text-lg md:text-xl font-semibold font-[var(--font-display)] text-zinc-950">
                  Location
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  View the map placement and verify the listing area before scheduling a tour.
                </p>
                <div className="mt-4">
                  {hasMapCoordinates ? (
                    <div className="h-56 md:h-72 overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-900/10">
                      <PropertyMap
                        latitude={typedProperty.latitude}
                        longitude={typedProperty.longitude}
                        title={typedProperty.title}
                        city={typedProperty.city}
                      />
                    </div>
                  ) : (
                    <div className="relative h-48 md:h-56 overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-900/10 bg-[#e7e2d8]">
                      <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 rounded-full bg-black/60 px-2 md:px-3 py-1 text-[10px] md:text-xs text-white">
                        {typedProperty.city}
                      </div>
                      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                        No location coordinates available
                      </div>
                    </div>
                  )}
                </div>
              </EditorialCard>

              <EditorialCard
                tone="dark"
                className="rounded-2xl md:rounded-3xl bg-[#141312] p-5 md:p-6 text-[#f5efe4] shadow-[0_18px_50px_-35px_rgba(0,0,0,0.55)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d2c4ad]">
                  Location Notes
                </p>
                <h3 className="mt-2 text-lg md:text-xl font-semibold font-[var(--font-display)] text-white">
                  Buyer checklist before visiting
                </h3>
                <div className="mt-4 space-y-3 text-sm text-[#e2d5c1]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    Check commute times and neighborhood access points around {typedProperty.city}.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    Ask for recent comparables and maintenance history before negotiation.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    Confirm parking, utilities, and floor-plan measurements with the agent.
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#d7cab6]">
                  Lat: {formatCoordinate(typedProperty.latitude)} • Lng: {formatCoordinate(typedProperty.longitude)}
                </div>
              </EditorialCard>
            </div>
          </div>

          <aside id="contact-agent" className="space-y-4 md:space-y-6 xl:sticky xl:top-24 xl:self-start">
            <EditorialCard className="overflow-hidden rounded-2xl md:rounded-3xl border-zinc-900/12 bg-white/90 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.45)]">
              <div className="border-b border-zinc-900/10 bg-[#faf5e9] px-4 py-4 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
                  Agent Desk
                </p>
                <h3 className="mt-2 text-xl md:text-2xl font-semibold font-[var(--font-display)] text-zinc-950">
                  Start the conversation
                </h3>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4 rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] p-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-white text-sm font-semibold text-zinc-800 shadow-sm">
                    LE
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.14em] text-zinc-500">Listed by</p>
                    <p className="truncate text-sm font-semibold text-zinc-900">Luxe Estates</p>
                    <p className="text-[10px] md:text-xs text-zinc-600">DRE-01234567</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] md:text-xs uppercase tracking-[0.14em] text-zinc-500">
                        Asking Price
                      </p>
                      <p className="mt-2 font-[var(--font-display)] text-3xl leading-none text-zinc-950">
                        {formattedPrice}
                      </p>
                    </div>
                    <EditorialPill tone="soft" className="px-3 py-1 text-[10px] md:text-xs">
                      {typedProperty.city}
                    </EditorialPill>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-zinc-900/10 bg-[#fbf8f0] px-3 py-2">
                      <p className="text-zinc-500">Price / sqft</p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {pricePerSqft ? formatCurrency(pricePerSqft) : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-900/10 bg-[#fbf8f0] px-3 py-2">
                      <p className="text-zinc-500">Map status</p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {hasMapCoordinates ? "Ready" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <MessageAgentButton
                    propertyId={typedProperty.id}
                    agentId={typedProperty.agent_id}
                  />
                </div>

                <div className="mt-5 border-t border-zinc-900/10 pt-5">
                  <InquiryForm
                    propertyId={typedProperty.id}
                    propertyTitle={typedProperty.title}
                  />
                </div>
              </div>
            </EditorialCard>

            <EditorialCard
              tone="dark"
              className="rounded-2xl md:rounded-3xl bg-[#141312] p-4 md:p-5 text-[#f5efe4] shadow-[0_18px_50px_-35px_rgba(0,0,0,0.55)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d2c4ad]">
                Listing Facts
              </p>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[#d7cab6] text-xs">Property ID</p>
                  <p className="mt-1 truncate font-semibold text-white">{typedProperty.id}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[#d7cab6] text-xs">Agent ID</p>
                  <p className="mt-1 truncate font-semibold text-white">{typedProperty.agent_id}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[#d7cab6] text-xs">Lat</p>
                    <p className="mt-1 font-semibold text-white">
                      {formatCoordinate(typedProperty.latitude)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[#d7cab6] text-xs">Lng</p>
                    <p className="mt-1 font-semibold text-white">
                      {formatCoordinate(typedProperty.longitude)}
                    </p>
                  </div>
                </div>
              </div>
            </EditorialCard>
          </aside>
        </section>
        </div>
      </main>
    </div>
  );
}
