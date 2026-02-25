"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { Toast, type ToastVariant } from "@/src/components/ui/toast";

type ListingStatus = "pending" | "approved" | "rejected" | string | null;

type PropertyImage = {
  image_url: string | null;
  is_primary: boolean | null;
};

type PropertyRow = {
  id: string;
  title: string | null;
  city: string | null;
  price: number | string | null;
  property_type: string | null;
  status: ListingStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  description: string | null;
  agent_phone: string | null;
  created_at?: string | null;
  review_feedback: string | null;
  property_images?: PropertyImage[];
};

type InquiryRow = {
  id: string;
  property_id: string | null;
  name: string | null;
  email: string | null;
  message: string | null;
  created_at?: string | null;
};

type InquiryWithProperty = InquiryRow & {
  property?: { title: string | null; city: string | null };
};

const propertySelect =
  "id,title,city,price,property_type,status,bedrooms,bathrooms,area_sqft,description,agent_phone,created_at,review_feedback,property_images(image_url,is_primary)";

const inquirySelect = "id,property_id,name,email,message,created_at";

export function AdminDashboard() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [pendingListings, setPendingListings] = useState<PropertyRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [decisionErrors, setDecisionErrors] = useState<Record<string, string>>({});
  const [decisionLoading, setDecisionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(
    null,
  );

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
  };

  const loadData = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!supabaseReady) {
        setLoadError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setLoadError(null);

      const { data: authData, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (authError || !authData.user) {
        setLoadError("Please sign in with an admin account to continue.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [pendingResponse, inquiryResponse] = await Promise.all([
        supabaseBrowserClient
          .from("properties")
          .select(propertySelect)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabaseBrowserClient
          .from("inquiries")
          .select(inquirySelect)
          .order("created_at", { ascending: false }),
      ]);

      if (pendingResponse.error) {
        setLoadError(pendingResponse.error.message);
      } else {
        const pending = (pendingResponse.data ?? []) as PropertyRow[];
        setPendingListings(pending);
        setFeedbackById((prev) => {
          const next = { ...prev };
          pending.forEach((item) => {
            if (!(item.id in next)) {
              next[item.id] = item.review_feedback ?? "";
            }
          });
          return next;
        });
      }

      if (inquiryResponse.error) {
        setLoadError(inquiryResponse.error.message);
      } else {
        const inquiryData = (inquiryResponse.data ?? []) as InquiryRow[];
        const propertyIds = Array.from(
          new Set(
            inquiryData
              .map((item) => item.property_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const propertyMap = new Map<
          string,
          { title: string | null; city: string | null }
        >();

        if (propertyIds.length > 0) {
          const { data: propertyData } = await supabaseBrowserClient
            .from("properties")
            .select("id,title,city")
            .in("id", propertyIds);

          const properties = (propertyData ?? []) as Array<{
            id: string;
            title: string | null;
            city: string | null;
          }>;

          properties.forEach((property) => {
            propertyMap.set(property.id, {
              title: property.title ?? null,
              city: property.city ?? null,
            });
          });
        }

        setInquiries(
          inquiryData.map((item) => ({
            ...item,
            property: item.property_id ? propertyMap.get(item.property_id) : undefined,
          })),
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    [supabaseReady],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData("initial");
  }, [loadData]);

  const updateFeedback = (id: string, value: string) => {
    setFeedbackById((prev) => ({ ...prev, [id]: value }));
  };

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    const feedback = feedbackById[id]?.trim() ?? "";

    if (status === "rejected" && !feedback) {
      setDecisionErrors((prev) => ({
        ...prev,
        [id]: "Please include feedback when rejecting a listing.",
      }));
      return;
    }

    setDecisionErrors((prev) => ({ ...prev, [id]: "" }));
    setDecisionLoading((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabaseBrowserClient
      .from("properties")
      .update({ status, review_feedback: feedback || null })
      .eq("id", id);

    if (error) {
      setDecisionErrors((prev) => ({ ...prev, [id]: error.message }));
      setDecisionLoading((prev) => ({ ...prev, [id]: false }));
      showToast("We could not update the listing status.", "error");
      return;
    }

    setPendingListings((prev) => prev.filter((item) => item.id !== id));
    setDecisionLoading((prev) => ({ ...prev, [id]: false }));
    showToast(
      status === "approved" ? "Listing approved." : "Listing rejected.",
      status === "approved" ? "success" : "info",
    );
  };

  const formatPrice = (price: PropertyRow["price"]) => {
    if (price === null || price === undefined || price === "") return "--";
    const value = Number(price);
    if (!Number.isFinite(value)) return "--";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPrimaryImage = (images?: PropertyImage[]) => {
    if (!images || images.length === 0) return null;
    return images.find((img) => img.is_primary) ?? images[0];
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-300 bg-gray-100 p-6 text-sm text-gray-700">
        Loading admin dashboard...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-6 text-sm text-red-200">
        {loadError} <Link className="underline" href="/auth?redirect=/admin">Go to auth</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {toast && (
        <div className="fixed inset-x-4 top-24 z-50 md:left-auto md:right-6">
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}
      <section className="rounded-2xl md:rounded-3xl border border-gray-300 bg-gray-100 p-4 md:p-6 shadow-[0_25px_60px_-50px_rgba(0,0,0,0.7)]">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div>
            <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.28em] text-gray-600">
              Pending listings
            </div>
            <h2 className="mt-1 md:mt-2 text-xl md:text-2xl font-semibold text-gray-900">
              Review queue
            </h2>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-700">
              Approve listings to publish them. Reject listings with feedback that
              helps agents revise.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData("refresh")}
            disabled={refreshing}
            className="rounded-full border border-gray-300 bg-gray-100 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold text-gray-800 transition hover:border-gray-300/30 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 md:mt-4 text-[10px] md:text-xs text-gray-600">
          {pendingListings.length} listings awaiting review
        </div>

        {pendingListings.length === 0 && (
          <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl border border-gray-300 bg-gray-50 px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700">
            Nothing pending right now. Check back soon.
          </div>
        )}

        <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 lg:grid-cols-2">
          {pendingListings.map((listing) => {
            const primaryImage = getPrimaryImage(listing.property_images);
            const decisionError = decisionErrors[listing.id];
            const decisionBusy = decisionLoading[listing.id];
            const feedback = feedbackById[listing.id] ?? "";

            return (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl md:rounded-3xl border border-gray-300 bg-white"
              >
                <div
                  className="h-28 md:h-36 bg-gray-200"
                  style={
                    primaryImage?.image_url
                      ? {
                          backgroundImage: `url(${primaryImage.image_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div className="space-y-3 md:space-y-4 p-3 md:p-5">
                  <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div>
                      <div className="text-base md:text-lg font-semibold text-gray-900">
                        {listing.title ?? "Untitled"}
                      </div>
                      <div className="text-xs md:text-sm text-gray-700">
                        {listing.city ?? ""} · {formatPrice(listing.price)}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-400/15 px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.15em] md:tracking-[0.2em] text-amber-200 whitespace-nowrap">
                      Pending
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs text-gray-600">
                    <span>{listing.property_type ?? "type"}</span>
                    <span>{listing.bedrooms ?? "--"} bd</span>
                    <span>{listing.bathrooms ?? "--"} ba</span>
                    <span>{listing.area_sqft ?? "--"} sqft</span>
                    {listing.created_at && (
                      <span className="hidden sm:inline">Submitted {formatDate(listing.created_at)}</span>
                    )}
                  </div>

                  {listing.description && (
                    <p className="text-[10px] md:text-xs text-gray-700 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {listing.agent_phone && (
                    <div className="text-[10px] md:text-xs text-gray-600">
                      Agent phone: {listing.agent_phone}
                    </div>
                  )}

                  <div className="rounded-xl md:rounded-2xl border border-gray-300 bg-gray-50 px-3 md:px-4 py-2 md:py-3">
                    <div className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.2em] md:tracking-[0.24em] text-gray-600">
                      Feedback for agent
                    </div>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={(event) => updateFeedback(listing.id, event.target.value)}
                      placeholder="Share what needs improvement or confirm approval notes."
                      className="mt-2 w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs text-gray-900 placeholder:text-gray-500"
                    />
                  </div>

                  {decisionError && (
                    <div className="rounded-lg md:rounded-xl border border-red-300/30 bg-red-500/10 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs text-red-200">
                      {decisionError}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs">
                    <button
                      type="button"
                      onClick={() => handleDecision(listing.id, "approved")}
                      disabled={decisionBusy}
                      className="flex-1 sm:flex-none rounded-full bg-emerald-500 px-3 md:px-4 py-1.5 md:py-2 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(listing.id, "rejected")}
                      disabled={decisionBusy}
                      className="flex-1 sm:flex-none rounded-full border border-rose-300/40 bg-rose-500/10 px-3 md:px-4 py-1.5 md:py-2 font-semibold text-rose-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl md:rounded-3xl border border-gray-300 bg-gray-100 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div>
            <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.28em] text-gray-600">
              Inquiries
            </div>
            <h2 className="mt-1 md:mt-2 text-xl md:text-2xl font-semibold text-gray-900">
              All marketplace inquiries
            </h2>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-700">
              Read-only stream of buyer requests across approved listings.
            </p>
          </div>
          <div className="text-[10px] md:text-xs text-gray-600">{inquiries.length} total</div>
        </div>

        {inquiries.length === 0 && (
          <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl border border-gray-300 bg-gray-50 px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700">
            No inquiries yet. Once buyers request tours, they will appear here.
          </div>
        )}

        <div className="mt-4 md:mt-6 grid gap-3 md:gap-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-xl md:rounded-2xl border border-gray-300 bg-white px-3 md:px-4 py-3 md:py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                <div>
                  <div className="text-xs md:text-sm font-semibold text-gray-900">
                    {inquiry.name ?? "Anonymous"}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-600">
                    {inquiry.email ?? "No email"}
                  </div>
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">
                  {formatDate(inquiry.created_at)}
                </div>
              </div>

              <div className="mt-2 md:mt-3 text-[10px] md:text-xs text-gray-600">
                Property: {inquiry.property?.title ?? "Unknown listing"}
                {inquiry.property?.city ? ` · ${inquiry.property.city}` : ""}
              </div>

              {inquiry.message && (
                <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-700">{inquiry.message}</p>
              )}

              {inquiry.property_id && (
                <div className="mt-2 md:mt-3 text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] text-gray-500">
                  Property ID: {inquiry.property_id}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
