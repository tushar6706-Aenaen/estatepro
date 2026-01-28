import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/inquiry-form";
import { ChatPanel } from "@/components/chat-panel";

type Props = {
  params: { id: string };
};

export default async function PropertyDetailPage({ params }: Props) {
  const supabase = createSupabaseServerClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id, title, description, city, price, property_type, bedrooms, bathrooms, area_sqft, status, agent_id, property_images(image_url, is_primary), agent:agent_id(full_name, phone)"
    )
    .eq("id", params.id)
    .single();

  if (error || !property || property.status !== "approved") {
    notFound();
  }

  const primaryImage =
    property.property_images?.find((img: any) => img.is_primary) ??
    property.property_images?.[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row">
      <section className="flex-1 space-y-4">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          <div className="relative h-72 w-full bg-neutral-100">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.image_url}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {property.title}
          </h1>
          <p className="text-sm text-neutral-600">{property.city}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs uppercase tracking-wide">
            {property.property_type}
          </span>
          {property.bedrooms != null && <span>{property.bedrooms} bedrooms</span>}
          {property.bathrooms != null && <span>{property.bathrooms} bathrooms</span>}
          {property.area_sqft != null && <span>{property.area_sqft} sqft</span>}
        </div>

        <article className="prose prose-sm max-w-none text-neutral-700">
          <p>{property.description}</p>
        </article>
      </section>

      <aside className="flex w-full max-w-sm flex-col gap-4 md:sticky md:top-16">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <span className="text-xl font-semibold text-blue-700">
              ₹{Number(property.price).toLocaleString()}
            </span>
          </div>
          <div className="space-y-1 text-sm text-neutral-700">
            <p className="font-medium">Listed by</p>
            <p>{property.agent?.full_name ?? "Agent"}</p>
            {property.agent?.phone && (
              <p className="text-xs text-neutral-500">
                Call:{" "}
                <a href={`tel:${property.agent.phone}`} className="text-neutral-900">
                  {property.agent.phone}
                </a>
              </p>
            )}
          </div>
        </div>

        <InquiryForm propertyId={property.id} />

        <ChatPanel
          propertyId={property.id}
          agentId={property.agent_id}
          agentName={property.agent?.full_name ?? "Agent"}
        />
      </aside>
    </main>
  );
}

