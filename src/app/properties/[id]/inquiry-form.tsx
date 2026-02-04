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
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-900 bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:border-gray-800 active:scale-95"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Schedule Tour
          </div>
        </button>
        <button
          type="button"
          className="relative overflow-hidden rounded-2xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 active:scale-95"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Request Info
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your Name"
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10"
          />
        </div>
        <div className="relative">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email Address"
            type="email"
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10"
          />
        </div>
        <div className="relative">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone Number"
            type="tel"
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10"
          />
        </div>
        <div className="relative">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`I am interested in ${propertyTitle}...`}
            rows={5}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none transition-all focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-l-4 border-red-500 bg-red-50 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border-l-4 border-green-500 bg-green-50 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Request a Tour
            </>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <p className="text-center text-xs text-gray-500 leading-relaxed">
        By sending a request, you agree to our <span className="font-medium text-gray-700">Terms & Privacy Policy</span>.
      </p>
    </form>
  );
}
