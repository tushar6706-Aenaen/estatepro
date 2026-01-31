"use client";

import { useEffect, useMemo, useState } from "react";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type InquiryFormProps = {
  propertyId: string;
  propertyTitle: string;
};

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
};

export function InquiryForm({ propertyId, propertyTitle }: InquiryFormProps) {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDefaults = async () => {
      if (!supabaseReady) return;

      const { data, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (cancelled) return;

      if (authError || !data.user) return;

      setEmail(data.user.email ?? "");

      const { data: profile } = await supabaseBrowserClient
        .from("profiles")
        .select("full_name, phone")
        .eq("id", data.user.id)
        .maybeSingle<ProfileRow>();

      if (cancelled) return;

      if (profile?.full_name) {
        setName(profile.full_name);
      }
      if (profile?.phone) {
        setPhone(profile.phone);
      }
    };

    loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabaseReady) {
      setError("Supabase environment variables are missing in .env.local.");
      return;
    }

    if (!propertyId) {
      setError("Missing property information. Try again in a moment.");
      return;
    }

    setLoading(true);

    const { data, error: authError } =
      await supabaseBrowserClient.auth.getUser();

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id ?? null;

    const payload = {
      property_id: propertyId,
      name: name.trim() ? name.trim() : null,
      email: email.trim() ? email.trim() : null,
      phone: phone.trim() ? phone.trim() : null,
      message: message.trim() ? message.trim() : null,
      user_id: userId,
      status: "pending",
    };

    const { error: insertError } = await supabaseBrowserClient
      .from("inquiries")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Request sent. An agent will follow up shortly.");
      setMessage("");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
        >
          Schedule Tour
        </button>
        <button
          type="button"
          className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
        >
          Request Info
        </button>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`I am interested in ${propertyTitle}...`}
          rows={4}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Request a Tour"}
      </button>
      <p className="text-center text-[11px] text-gray-600">
        By sending a request, you agree to our Terms & Privacy Policy.
      </p>
    </form>
  );
}
