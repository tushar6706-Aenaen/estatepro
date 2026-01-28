import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { RequestTourForm } from "./request-tour-form";

const highlightIcons: Record<string, () => JSX.Element> = {
  "Private Pool": PoolIcon,
  "Central Air": AirIcon,
  "EV Charging": EvIcon,
  Gym: GymIcon,
  "Wine Cellar": WineIcon,
  "Smart Security": ShieldIcon,
};

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

type PropertyDetail = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  price: number | string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  agent_phone: string | null;
  property_images: { image_url: string | null; is_primary: boolean | null }[];
};

const defaultHighlights = [
  "Private Pool",
  "Central Air",
  "EV Charging",
  "Gym",
  "Wine Cellar",
  "Smart Security",
];

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    notFound();
  }

  const supabase = createSupabaseServerClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id,title,description,city,price,property_type,bedrooms,bathrooms,area_sqft,agent_phone,status,property_images(image_url,is_primary)",
    )
    .eq("id", params.id)
    .eq("status", "approved")
    .maybeSingle<PropertyDetail>();

  if (error || !property) {
    notFound();
  }

  const images = property.property_images ?? [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const galleryRest = images.filter((img) => img !== primaryImage).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <LogoIcon />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              LuxeEstates
            </span>
          </div>

          <div className="hidden flex-1 items-center gap-3 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 md:flex">
            <SearchIcon className="text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
            />
          </div>

          <nav className="ml-auto hidden items-center gap-6 text-sm text-slate-300 md:flex">
            {["Buy", "Sell", "Agents", "Market Insights"].map((link) => (
              <a key={link} className="transition hover:text-white" href="#">
                {link}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:text-white">
              <BellIcon />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:text-white">
              <UserIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <div className="text-sm text-slate-400">
          Home / Buy / <span className="text-white">{property.city}</span>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4 md:grid-cols-4 md:grid-rows-2">
            <div
              className={`relative col-span-2 row-span-2 overflow-hidden rounded-2xl bg-cover bg-center`}
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
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                Featured
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(2,6,23,0.2),_rgba(2,6,23,0.05))]" />
            </div>

            {galleryRest.map((item, index) => (
              <div
                key={item.image_url ?? `image-${index}`}
                className="relative overflow-hidden rounded-2xl bg-cover bg-center"
                style={
                  item.image_url
                    ? {
                        backgroundImage: `url(${item.image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(2,6,23,0.2),_rgba(2,6,23,0.05))]" />
              </div>
            ))}
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-slate-200">
                SJ
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Listed by
                </div>
                <div className="text-base font-semibold text-white">
                  Sarah Jenkins
                </div>
                <div className="text-xs text-blue-300">DRE# 01234567</div>
                {property.agent_phone && (
                  <div className="text-xs text-slate-300">
                    Phone: {property.agent_phone}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                Schedule Tour
              </button>
              <button className="flex-1 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-semibold text-slate-300">
                Request Info
              </button>
            </div>

            <RequestTourForm propertyId={property.id} propertyTitle={property.title} />
          </aside>
        </section>

        <section className="mt-10 space-y-10">
          <div className="space-y-3">
            <div className="text-3xl font-semibold text-white">
              ${Number(property.price).toLocaleString()}
            </div>
            <div className="text-slate-400">
              {property.title}
            </div>
            <div className="flex flex-wrap gap-6 border-y border-white/10 py-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <BedIcon />
                {property.bedrooms ?? "—"} Beds
              </span>
              <span className="flex items-center gap-2">
                <BathIcon />
                {property.bathrooms ?? "—"} Baths
              </span>
              <span className="flex items-center gap-2">
                <AreaIcon />
                {property.area_sqft ?? "—"} Sqft
              </span>
              <span className="flex items-center gap-2">
                <GarageIcon />
                Garage
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <h2 className="text-lg font-semibold text-white">About this home</h2>
            <p>
              {property.description ??
                "Modern luxury living with open floor plan, generous natural light, and seamless indoor-outdoor flow."}
            </p>
            <button className="text-sm font-semibold text-blue-300">
              Read more v
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Highlights</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaultHighlights.map((highlight) => {
                const Icon = highlightIcons[highlight] ?? ShieldIcon;
                return (
                  <div
                    key={highlight}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
                      <Icon />
                    </span>
                    <span>{highlight}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Location</h3>
            <div className="relative h-64 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(15,23,42,0.8),_rgba(15,23,42,0.4))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%)]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 p-3 text-white shadow-lg">
                <PinIcon />
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {property.city}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m4.9 4.9 14.2 14.2" />
      <path d="m19.1 4.9-14.2 14.2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BedIcon() {
  return (
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
      <path d="M3 10h18" />
      <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
      <path d="M5 20v-6h14v6" />
    </svg>
  );
}

function BathIcon() {
  return (
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
      <path d="M9 6h6" />
      <path d="M7 6h10l1 6H6l1-6z" />
      <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function AreaIcon() {
  return (
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
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 12h16" />
      <path d="M12 4v16" />
    </svg>
  );
}

function GarageIcon() {
  return (
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
      <path d="M3 12 12 4l9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function PoolIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20c2 2 6 2 8 0s6-2 8 0" />
      <path d="M2 16c2 2 6 2 8 0s6-2 8 0" />
      <path d="M12 4v8" />
      <path d="M8 8h8" />
    </svg>
  );
}

function AirIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h10a2 2 0 1 0-2-2" />
      <path d="M4 12h14a2 2 0 1 0-2-2" />
      <path d="M4 16h8a2 2 0 1 1-2 2" />
    </svg>
  );
}

function EvIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2h-2l-2 4h4l-2 4" />
      <rect x="6" y="8" width="12" height="10" rx="2" />
      <path d="M10 18v2" />
      <path d="M14 18v2" />
    </svg>
  );
}

function GymIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M6 10v4" />
      <path d="M18 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function WineIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10" />
      <path d="M7 3v7a5 5 0 0 0 10 0V3" />
      <path d="M12 10v9" />
      <path d="M8 22h8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6-4.4-6-10a6 6 0 1 1 12 0c0 5.6-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}
