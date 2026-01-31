"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { sendMessage } from "@/src/lib/chat/client";

type ChatRow = {
  id: string;
  property_id: string;
  agent_id: string;
  user_id: string;
  created_at: string;
};

type PropertyRow = {
  id: string;
  title: string | null;
  city: string | null;
  price: number | string | null;
  property_images?: { image_url: string | null; is_primary: boolean | null }[];
};

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
};

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
};

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const chatId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadThread = async () => {
      if (!supabaseReady) {
        setError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      if (!chatId) {
        setError("Chat id is missing.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (authError || !authData.user) {
        setError("Sign in to view this chat.");
        setLoading(false);
        return;
      }

      setUserId(authData.user.id);

      const { data: chatRow, error: chatError } =
        await supabaseBrowserClient
          .from("chats")
          .select("id, property_id, agent_id, user_id, created_at")
          .eq("id", chatId)
          .maybeSingle<ChatRow>();

      if (cancelled) return;

      if (chatError) {
        setError(chatError.message);
        setLoading(false);
        return;
      }

      if (!chatRow) {
        setError("Chat not found.");
        setLoading(false);
        return;
      }

      setChat(chatRow);

      const [propertyResponse, messagesResponse] = await Promise.all([
        supabaseBrowserClient
          .from("properties")
          .select("id, title, city, price, property_images(image_url, is_primary)")
          .eq("id", chatRow.property_id)
          .maybeSingle<PropertyRow>(),
        supabaseBrowserClient
          .from("messages")
          .select("id, chat_id, sender_id, sender_role, content, created_at")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true })
          .returns<MessageRow[]>(),
      ]);

      if (cancelled) return;

      if (propertyResponse.error) {
        setError(propertyResponse.error.message);
      }

      if (messagesResponse.error) {
        setError(messagesResponse.error.message);
      }

      setProperty(propertyResponse.data ?? null);
      setMessages(messagesResponse.data ?? []);
      setLoading(false);
    };

    loadThread();

    return () => {
      cancelled = true;
    };
  }, [chatId, supabaseReady]);

  const handleSend = async () => {
    if (!chatId || !input.trim()) return;
    setSending(true);
    setError(null);

    const { data, error: sendError } = await sendMessage({
      chatId,
      content: input,
    });

    if (sendError || !data) {
      setError(sendError?.message ?? "Unable to send message.");
      setSending(false);
      return;
    }

    setMessages((prev) => [...prev, data]);
    setInput("");
    setSending(false);
  };

  const primaryImage =
    property?.property_images?.find((img) => img.is_primary) ??
    property?.property_images?.[0];
  const priceNumber = Number(property?.price);
  const price = Number.isFinite(priceNumber)
    ? `$${priceNumber.toLocaleString()}`
    : property?.price
      ? `$${property?.price}`
      : "$0";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <button
          type="button"
          onClick={() => router.push("/chats")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        >
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
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to messages
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="h-16 w-24 overflow-hidden rounded-2xl bg-neutral-800"
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
            <div className="flex-1">
              <p className="text-sm text-neutral-400">
                {property?.city ?? "Location pending"}
              </p>
              <h1 className="text-xl font-semibold text-white">
                {property?.title ?? "Property conversation"}
              </h1>
              <p className="text-sm text-neutral-300">{price}</p>
            </div>
            <Link
              href={property ? `/properties/${property.id}` : "/"}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
            >
              View listing
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex h-[520px] flex-col rounded-3xl border border-white/10 bg-neutral-900/40">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {loading && (
                <div className="text-sm text-neutral-400">Loading chat...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="text-sm text-neutral-400">
                  No messages yet. Say hello to get started.
                </div>
              )}
              {!loading &&
                messages.map((message) => {
                  const isSelf = message.sender_id === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          isSelf
                            ? "bg-neutral-500 text-white"
                            : "bg-white/10 text-neutral-200"
                        }`}
                      >
                        <p>{message.content}</p>
                        <span className="mt-2 block text-[10px] text-white/60">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Write a message..."
                  className="min-h-[80px] flex-1 resize-none rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-full bg-neutral-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5">
              <h2 className="text-sm font-semibold text-white">Chat details</h2>
              <div className="mt-4 space-y-3 text-xs text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Started</span>
                  <span>{chat ? formatTimestamp(chat.created_at) : "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Messages</span>
                  <span>{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span>{chat ? "Active" : "--"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-5 text-xs text-neutral-400">
              Keep conversations respectful. Listings are updated regularly.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
