"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  propertyId: string;
};

export function InquiryForm({ propertyId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("inquiries").insert({
        property_id: propertyId,
        name,
        email,
        message,
      });

      if (insertError) {
        setError(insertError.message);
        setStatus("error");
      } else {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold tracking-tight">
        Send an inquiry
      </h2>
      <div className="mb-3 space-y-2">
        <input
          type="text"
          required
          placeholder="Your name"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          required
          placeholder="Your email"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          required
          placeholder="Ask a question about this property"
          className="min-h-[80px] w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {status === "success" && (
        <p className="mb-2 text-xs text-green-600">
          Inquiry sent. The agent will get back to you soon.
        </p>
      )}

      {status === "error" && error && (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}

