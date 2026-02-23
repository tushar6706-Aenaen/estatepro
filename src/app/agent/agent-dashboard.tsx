"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import {
  EditorialCard,
  EditorialFieldShell,
  EditorialNotice,
  EditorialPill,
  editorialButtonClass,
} from "@/src/components/ui/editorial";
import { Toast, type ToastVariant } from "@/src/components/ui/toast";

type ListingStatus = "pending" | "approved" | "rejected" | string | null;

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
  latitude: number | null;
  longitude: number | null;
  agent_phone: string | null;
  review_feedback: string | null;
  created_at?: string | null;
};

type ProfileRow = {
  phone: string | null;
  role: "public" | "agent" | "admin" | null;
};

type ListingFormState = {
  title: string;
  city: string;
  price: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  description: string;
  latitude: string;
  longitude: string;
};

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const storageBucket = "property-images";
const propertySelect =
  "id,title,city,price,property_type,status,bedrooms,bathrooms,area_sqft,description,latitude,longitude,agent_phone,review_feedback,created_at";
const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500";
const fieldHintClass = "text-xs text-zinc-500";
const fieldInputClass =
  "w-full border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none";
const fieldTextareaClass =
  "min-h-[92px] w-full resize-y border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none";
const fieldSelectClass =
  "w-full rounded-xl border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none";

export function AgentDashboard() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [listings, setListings] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formState, setFormState] = useState<ListingFormState>({
    title: "",
    city: "",
    price: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    areaSqft: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<ListingFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(
    null,
  );

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
  };

  useEffect(() => {
    const loadListings = async () => {
      if (!supabaseReady) {
        setLoadError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseBrowserClient.auth.getUser();
      if (error || !data.user) {
        setLoadError("Please sign in to view your listings.");
        setLoading(false);
        return;
      }

      setUserId(data.user.id);

      const { data: profileData } = await supabaseBrowserClient
        .from("profiles")
        .select("phone, role")
        .eq("id", data.user.id)
        .maybeSingle<ProfileRow>();

      setProfile(profileData ?? null);

      const { data: listingData, error: listingError } =
        await supabaseBrowserClient
          .from("properties")
          .select(propertySelect)
          .eq("agent_id", data.user.id)
          .order("created_at", { ascending: false });

      if (listingError) {
        setLoadError(listingError.message);
      } else {
        setListings(listingData ?? []);
      }

      setLoading(false);
    };

    loadListings();
  }, [supabaseReady]);

  const updateForm = (field: keyof ListingFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field: keyof ListingFormState, value: string) => {
    setEditState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const resetForm = () => {
    setFormState({
      title: "",
      city: "",
      price: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      areaSqft: "",
      description: "",
      latitude: "",
      longitude: "",
    });
    setImageFiles([]);
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageFiles(files);
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const uploadImages = async (propertyId: string, files: File[]) => {
    if (files.length === 0 || !userId) return;

    const uploads = await Promise.all(
      files.map(async (file, index) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `properties/${userId}/${propertyId}/${Date.now()}-${index}-${safeName}`;
        const { error: uploadError } = await supabaseBrowserClient.storage
          .from(storageBucket)
          .upload(path, file, { upsert: false, cacheControl: "3600" });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicData } = supabaseBrowserClient.storage
          .from(storageBucket)
          .getPublicUrl(path);

        return {
          property_id: propertyId,
          image_url: publicData.publicUrl,
          is_primary: index === 0,
        };
      }),
    );

    const { error: insertError } = await supabaseBrowserClient
      .from("property_images")
      .insert(uploads);

    if (insertError) {
      throw new Error(insertError.message);
    }
  };

  const handleCreateListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!userId) {
      setFormError("Please sign in before creating a listing.");
      return;
    }

    if (!formState.title.trim() || !formState.city.trim()) {
      setFormError("Title and city are required.");
      return;
    }

    if (!formState.propertyType) {
      setFormError("Please choose a property type.");
      return;
    }

    const priceValue = Number(formState.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setFormError("Please enter a valid price.");
      return;
    }

    setSaving(true);

    const payload = {
      title: formState.title.trim(),
      city: formState.city.trim(),
      price: priceValue,
      property_type: formState.propertyType,
      bedrooms: parseNumber(formState.bedrooms),
      bathrooms: parseNumber(formState.bathrooms),
      area_sqft: parseNumber(formState.areaSqft),
      description: formState.description.trim() || null,
      latitude: parseNumber(formState.latitude),
      longitude: parseNumber(formState.longitude),
      status: "pending",
      agent_id: userId,
      agent_phone: profile?.phone ?? null,
    };

    const { data, error } = await supabaseBrowserClient
      .from("properties")
      .insert(payload)
      .select(propertySelect)
      .single<PropertyRow>();

    if (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }

    try {
      await uploadImages(data.id, imageFiles);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed.";
      setFormError(`Listing saved but images failed to upload. ${message}`);
    }

    setListings((prev) => [data, ...prev]);
    resetForm();
    setFormSuccess("Listing created. Status is pending approval.");
    showToast("Listing created and sent for review.", "success");
    setSaving(false);
  };

  const startEdit = (listing: PropertyRow) => {
    setEditId(listing.id);
    setEditState({
      title: listing.title ?? "",
      city: listing.city ?? "",
      price: listing.price ? String(listing.price) : "",
      propertyType: listing.property_type ?? "",
      bedrooms: listing.bedrooms !== null ? String(listing.bedrooms) : "",
      bathrooms: listing.bathrooms !== null ? String(listing.bathrooms) : "",
      areaSqft: listing.area_sqft !== null ? String(listing.area_sqft) : "",
      description: listing.description ?? "",
      latitude: listing.latitude !== null ? String(listing.latitude) : "",
      longitude: listing.longitude !== null ? String(listing.longitude) : "",
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditState(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editId || !editState) return;
    setEditError(null);

    if (!editState.title.trim() || !editState.city.trim()) {
      setEditError("Title and city are required.");
      return;
    }

    if (!editState.propertyType) {
      setEditError("Please choose a property type.");
      return;
    }

    const priceValue = Number(editState.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setEditError("Please enter a valid price.");
      return;
    }

    setEditSaving(true);

    const payload = {
      title: editState.title.trim(),
      city: editState.city.trim(),
      price: priceValue,
      property_type: editState.propertyType,
      bedrooms: parseNumber(editState.bedrooms),
      bathrooms: parseNumber(editState.bathrooms),
      area_sqft: parseNumber(editState.areaSqft),
      description: editState.description.trim() || null,
      latitude: parseNumber(editState.latitude),
      longitude: parseNumber(editState.longitude),
    };

    const { data, error } = await supabaseBrowserClient
      .from("properties")
      .update(payload)
      .eq("id", editId)
      .select(propertySelect)
      .single<PropertyRow>();

    if (error) {
      setEditError(error.message);
      setEditSaving(false);
      return;
    }

    setListings((prev) =>
      prev.map((item) => (item.id === data.id ? data : item)),
    );
    setEditSaving(false);
    cancelEdit();
    showToast("Listing updated.", "success");
  };

  const handleDelete = async (listing: PropertyRow) => {
    if (!listing.id) return;
    const confirmed = window.confirm(
      "Remove this listing? Use this after it is sold or rented. This cannot be undone.",
    );
    if (!confirmed) return;

    const { error: imagesError } = await supabaseBrowserClient
      .from("property_images")
      .delete()
      .eq("property_id", listing.id);

    if (imagesError) {
      setLoadError(imagesError.message);
      return;
    }

    const { error } = await supabaseBrowserClient
      .from("properties")
      .delete()
      .eq("id", listing.id);

    if (error) {
      setLoadError(error.message);
      return;
    }

    setListings((prev) => prev.filter((item) => item.id !== listing.id));
    showToast("Listing removed.", "info");
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

  const formatStatus = (status: ListingStatus) => {
    if (!status) return "unknown";
    return status;
  };

  const statusBadge = (status: ListingStatus) => {
    switch (status) {
      case "approved":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700";
      case "rejected":
        return "border border-rose-200 bg-rose-50 text-rose-700";
      case "pending":
      default:
        return "border border-amber-200 bg-amber-50 text-amber-700";
    }
  };

  const requiredFieldCount = [
    formState.title,
    formState.city,
    formState.price,
    formState.propertyType,
  ].filter((value) => value.trim()).length;
  const hasCoordinates = Boolean(
    formState.latitude.trim() && formState.longitude.trim(),
  );
  const readinessPercent = Math.round((requiredFieldCount / 4) * 100);

  if (loading) {
    return (
      <EditorialCard className="p-5 sm:p-6">
        <EditorialNotice tone="neutral">Loading your listings...</EditorialNotice>
      </EditorialCard>
    );
  }

  if (loadError) {
    return (
      <EditorialCard className="p-5 sm:p-6">
        <EditorialNotice tone="error">
          {loadError}{" "}
          <Link className="underline underline-offset-4" href="/auth?redirect=/agent">
            Go to auth
          </Link>
        </EditorialNotice>
      </EditorialCard>
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
      <section className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)]">
        <EditorialCard tone="glass" className="p-4 md:p-6">
          <form
            onSubmit={handleCreateListing}
            aria-busy={saving}
            className="space-y-5 md:space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">
                  Listing composer
                </div>
                <h2 className="font-serif text-2xl leading-tight text-zinc-950 sm:text-3xl">
                  Publish a new property dossier
                </h2>
                <p className="max-w-2xl text-sm text-zinc-700">
                  New submissions enter review in <span className="font-semibold">pending</span>{" "}
                  status. Upload photos from your device and the first image becomes
                  the primary cover.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <EditorialPill tone="soft">
                  Readiness {readinessPercent}%
                </EditorialPill>
                <EditorialPill tone={imageFiles.length > 0 ? "dark" : "default"}>
                  {imageFiles.length} photo{imageFiles.length === 1 ? "" : "s"}
                </EditorialPill>
              </div>
            </div>

            <EditorialCard tone="soft" radius="xl" className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                    Submission notes
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">
                    Required: title, city, price, and property type. Coordinates
                    are optional but recommended for map visibility.
                  </p>
                </div>
                <EditorialPill tone="soft" className="font-mono text-[11px]">
                  bucket/{storageBucket}
                </EditorialPill>
              </div>
            </EditorialCard>

            <div className="grid gap-4">
              <div className="grid gap-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                  Core details
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorialFieldShell className="sm:col-span-2 items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-title">
                        Listing title
                      </label>
                      <input
                        id="listing-title"
                        value={formState.title}
                        onChange={(event) => updateForm("title", event.target.value)}
                        placeholder="Modern 3BHK with skyline balcony"
                        className={fieldInputClass}
                        autoComplete="off"
                      />
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-city">
                        City
                      </label>
                      <input
                        id="listing-city"
                        value={formState.city}
                        onChange={(event) => updateForm("city", event.target.value)}
                        placeholder="Mumbai"
                        className={fieldInputClass}
                        autoComplete="address-level2"
                      />
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-type">
                        Property type
                      </label>
                      <select
                        id="listing-type"
                        value={formState.propertyType}
                        onChange={(event) =>
                          updateForm("propertyType", event.target.value)
                        }
                        className={fieldSelectClass}
                      >
                        <option value="">Select a type</option>
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start sm:col-span-2">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-price">
                        Asking price
                      </label>
                      <input
                        id="listing-price"
                        value={formState.price}
                        onChange={(event) => updateForm("price", event.target.value)}
                        placeholder="25000000"
                        type="number"
                        min="0"
                        className={fieldInputClass}
                        inputMode="numeric"
                      />
                    </div>
                  </EditorialFieldShell>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                  Property metrics
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-beds">
                        Bedrooms
                      </label>
                      <input
                        id="listing-beds"
                        value={formState.bedrooms}
                        onChange={(event) => updateForm("bedrooms", event.target.value)}
                        placeholder="3"
                        type="number"
                        min="0"
                        className={fieldInputClass}
                        inputMode="numeric"
                      />
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-baths">
                        Bathrooms
                      </label>
                      <input
                        id="listing-baths"
                        value={formState.bathrooms}
                        onChange={(event) =>
                          updateForm("bathrooms", event.target.value)
                        }
                        placeholder="2.5"
                        type="number"
                        min="0"
                        step="0.5"
                        className={fieldInputClass}
                        inputMode="decimal"
                      />
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-sqft">
                        Area (sqft)
                      </label>
                      <input
                        id="listing-sqft"
                        value={formState.areaSqft}
                        onChange={(event) => updateForm("areaSqft", event.target.value)}
                        placeholder="1450"
                        type="number"
                        min="0"
                        className={fieldInputClass}
                        inputMode="numeric"
                      />
                    </div>
                  </EditorialFieldShell>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                  Description
                </div>
                <EditorialFieldShell className="items-start">
                  <div className="grid w-full gap-1.5">
                    <label className={fieldLabelClass} htmlFor="listing-description">
                      Property overview
                    </label>
                    <textarea
                      id="listing-description"
                      value={formState.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      placeholder="Highlight the layout, neighborhood, condition, and key features."
                      rows={4}
                      className={fieldTextareaClass}
                    />
                  </div>
                </EditorialFieldShell>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                    Map placement
                  </div>
                  <EditorialPill tone={hasCoordinates ? "dark" : "default"}>
                    {hasCoordinates ? "Map ready" : "Coordinates optional"}
                  </EditorialPill>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-latitude">
                        Latitude
                      </label>
                      <input
                        id="listing-latitude"
                        value={formState.latitude}
                        onChange={(event) => updateForm("latitude", event.target.value)}
                        placeholder="19.0760"
                        type="number"
                        step="any"
                        className={fieldInputClass}
                        inputMode="decimal"
                      />
                    </div>
                  </EditorialFieldShell>

                  <EditorialFieldShell className="items-start">
                    <div className="grid w-full gap-1.5">
                      <label className={fieldLabelClass} htmlFor="listing-longitude">
                        Longitude
                      </label>
                      <input
                        id="listing-longitude"
                        value={formState.longitude}
                        onChange={(event) => updateForm("longitude", event.target.value)}
                        placeholder="72.8777"
                        type="number"
                        step="any"
                        className={fieldInputClass}
                        inputMode="decimal"
                      />
                    </div>
                  </EditorialFieldShell>
                </div>
                <p className={fieldHintClass}>
                  Tip: copy coordinates directly from Google Maps to enable the
                  interactive property map on the listing page.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 sm:text-xs">
                  Photos
                </div>
                <EditorialFieldShell className="items-start">
                  <div className="grid w-full gap-2">
                    <label className={fieldLabelClass} htmlFor="listing-photos">
                      Upload images
                    </label>
                    <input
                      id="listing-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFiles}
                      className="w-full text-sm text-zinc-700 file:mr-3 file:rounded-full file:border file:border-zinc-300 file:bg-white file:px-4 file:py-2 file:text-xs file:font-semibold file:text-zinc-800 hover:file:border-zinc-400"
                    />
                    <p className={fieldHintClass}>
                      The first selected image is marked as the primary photo.
                    </p>
                    {imageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {imageFiles.slice(0, 4).map((file) => (
                          <EditorialPill
                            key={`${file.name}-${file.lastModified}`}
                            tone="soft"
                            className="max-w-full"
                            title={file.name}
                          >
                            {file.name}
                          </EditorialPill>
                        ))}
                        {imageFiles.length > 4 && (
                          <EditorialPill tone="soft">
                            +{imageFiles.length - 4} more
                          </EditorialPill>
                        )}
                      </div>
                    )}
                  </div>
                </EditorialFieldShell>
              </div>
            </div>

            {formError && <EditorialNotice tone="error">{formError}</EditorialNotice>}
            {formSuccess && (
              <EditorialNotice tone="success">{formSuccess}</EditorialNotice>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className={editorialButtonClass({
                  tone: "primary",
                  className: "min-w-[160px]",
                })}
              >
                {saving ? "Saving..." : "Create listing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={editorialButtonClass({ tone: "secondary" })}
              >
                Clear draft
              </button>
            </div>
          </form>
        </EditorialCard>

        <div className="grid gap-4 content-start">
          <EditorialCard tone="glass" className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">
                  Agent profile
                </div>
                <h3 className="mt-2 font-serif text-2xl leading-tight text-zinc-950">
                  Contact routing
                </h3>
                <p className="mt-2 text-sm text-zinc-700">
                  Buyer inquiries use the phone number from your onboarding profile.
                </p>
              </div>

              <div className="grid gap-3">
                <EditorialFieldShell tone="readonly" className="items-start">
                  <div className="grid w-full gap-1.5">
                    <div className={fieldLabelClass}>Phone shown on listings</div>
                    <div className="text-sm font-medium text-zinc-900">
                      {profile?.phone ?? "--"}
                    </div>
                  </div>
                </EditorialFieldShell>
                <EditorialFieldShell tone="readonly" className="items-start">
                  <div className="grid w-full gap-1.5">
                    <div className={fieldLabelClass}>Current role</div>
                    <div className="capitalize text-sm font-medium text-zinc-900">
                      {profile?.role ?? "public"}
                    </div>
                  </div>
                </EditorialFieldShell>
              </div>

              <Link
                href="/onboarding"
                className={editorialButtonClass({
                  tone: "secondary",
                  className: "w-full justify-center",
                })}
              >
                Update onboarding info
              </Link>
            </div>
          </EditorialCard>

          <EditorialCard tone="soft" className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">
                  Submission checklist
                </div>
                <p className="mt-2 text-sm text-zinc-700">
                  Quick preflight before you submit your listing for review.
                </p>
              </div>

              <div className="grid gap-2 text-sm text-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <span>Required fields</span>
                  <EditorialPill tone={requiredFieldCount === 4 ? "dark" : "soft"}>
                    {requiredFieldCount}/4
                  </EditorialPill>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Coordinates</span>
                  <EditorialPill tone={hasCoordinates ? "dark" : "default"}>
                    {hasCoordinates ? "Added" : "Optional"}
                  </EditorialPill>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Photos selected</span>
                  <EditorialPill tone={imageFiles.length > 0 ? "dark" : "default"}>
                    {imageFiles.length}
                  </EditorialPill>
                </div>
              </div>
            </div>
          </EditorialCard>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-gray-600">
              My listings
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Properties you manage
            </h2>
          </div>
          <div className="text-xs text-gray-600">
            {listings.length} total
          </div>
        </div>

        {listings.length === 0 && (
          <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-sm text-gray-700">
            No listings yet. Create your first listing using the form above.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {listings.map((listing) => {
            const canEdit =
              listing.status === "pending" || listing.status === "rejected";
            const isEditing = editId === listing.id;

            return (
              <div
                key={listing.id}
                className="rounded-3xl border border-gray-300 bg-white p-5 shadow-[0_25px_60px_-50px_rgba(0,0,0,0.8)]"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-600">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${statusBadge(
                      listing.status,
                    )}`}
                  >
                    {formatStatus(listing.status)}
                  </span>
                  <span>{listing.created_at?.split("T")[0] ?? ""}</span>
                </div>

                {isEditing && editState ? (
                  <div className="mt-4 space-y-3">
                    <input
                      value={editState.title}
                      onChange={(event) => updateEditForm("title", event.target.value)}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                      placeholder="Title"
                    />
                    <input
                      value={editState.city}
                      onChange={(event) => updateEditForm("city", event.target.value)}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                      placeholder="City"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={editState.price}
                        onChange={(event) => updateEditForm("price", event.target.value)}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Price"
                        type="number"
                      />
                      <select
                        value={editState.propertyType}
                        onChange={(event) =>
                          updateEditForm("propertyType", event.target.value)
                        }
                        className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 hover:border-gray-300"
                      >
                        <option value="">Property type</option>
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        value={editState.bedrooms}
                        onChange={(event) =>
                          updateEditForm("bedrooms", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Beds"
                        type="number"
                      />
                      <input
                        value={editState.bathrooms}
                        onChange={(event) =>
                          updateEditForm("bathrooms", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Baths"
                        type="number"
                        step="0.5"
                      />
                      <input
                        value={editState.areaSqft}
                        onChange={(event) =>
                          updateEditForm("areaSqft", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Sqft"
                        type="number"
                      />
                    </div>
                    <textarea
                      value={editState.description}
                      onChange={(event) =>
                        updateEditForm("description", event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                      placeholder="Description"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={editState.latitude}
                        onChange={(event) =>
                          updateEditForm("latitude", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Latitude"
                        type="number"
                        step="any"
                      />
                      <input
                        value={editState.longitude}
                        onChange={(event) =>
                          updateEditForm("longitude", event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
                        placeholder="Longitude"
                        type="number"
                        step="any"
                      />
                    </div>
                    {editError && (
                      <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                        {editError}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleEditSave}
                        disabled={editSaving}
                        className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-70"
                      >
                        {editSaving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {listing.title ?? "Untitled"}
                    </div>
                    <div className="text-sm text-gray-700">
                      {listing.city ?? "--"} - {formatPrice(listing.price)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {listing.property_type ?? "type"} -{" "}
                      {listing.bedrooms ?? "--"} bd -{" "}
                      {listing.bathrooms ?? "--"} ba -{" "}
                      {listing.area_sqft ?? "--"} sqft
                    </div>
                    {listing.description && (
                      <p className="text-xs text-gray-600">
                        {listing.description}
                      </p>
                    )}
                    {listing.status === "rejected" && listing.review_feedback && (
                      <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                        Admin feedback: {listing.review_feedback}
                      </div>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-5 flex flex-wrap gap-3 text-xs">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => startEdit(listing)}
                        className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 font-semibold text-gray-800"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(listing)}
                      className="rounded-full border border-rose-300/30 bg-rose-500/10 px-4 py-2 font-semibold text-rose-200"
                    >
                      Remove
                    </button>
                    {!canEdit && (
                      <span className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600">
                        Editing disabled after approval. Remove listings once
                        sold or rented.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
