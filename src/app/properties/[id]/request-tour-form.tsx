"use client";

import { useState } from "react";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type Props = {
  propertyId: string;
  propertyTitle: string;
};

export function RequestTourForm({ propertyId, propertyTitle }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`I am interested in ${propertyTitle}...`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name || !email) {
      setError("Please add your name and email.");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabaseBrowserClient.from("inquiries").insert({
      property_id: propertyId,
      name,
      email,
      message,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        placeholder="I am interested in this property..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {error && (
        <div className="rounded-xl border border-red-200/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Request sent. We will get back to you shortly.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending..." : "Request a Tour"}
      </button>
      <p className="text-xs text-slate-500">
        By sending a request, you agree to our Terms & Privacy Policy.
      </p>
    </form>
  );
}
