"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
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

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatPrice = (value: number | string | null | undefined) => {
  if (value == null) return "Price N/A";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return priceFormatter.format(numericValue);
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
  const [otherProfile, setOtherProfile] = useState<ProfileRow | null>(null);
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

      const otherParticipantId =
        chatRow.user_id === authData.user.id
          ? chatRow.agent_id
          : chatRow.user_id;

      const [propertyResponse, messagesResponse, profileResponse] =
        await Promise.all([
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
        supabaseBrowserClient
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .eq("id", otherParticipantId)
          .maybeSingle<ProfileRow>(),
      ]);

      if (cancelled) return;

      if (propertyResponse.error) {
        setError(propertyResponse.error.message);
      }

      if (messagesResponse.error) {
        setError(messagesResponse.error.message);
      }

      if (profileResponse.error) {
        setError(profileResponse.error.message);
      }

      setProperty(propertyResponse.data ?? null);
      setOtherProfile(profileResponse.data ?? null);
      setMessages(messagesResponse.data ?? []);
      setLoading(false);
    };

    loadThread();

    return () => {
      cancelled = true;
    };
  }, [chatId, supabaseReady]);

  useEffect(() => {
    if (!chatId || !supabaseReady) return;

    const channel = supabaseBrowserClient
      .channel(`chat-thread-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      supabaseBrowserClient.removeChannel(channel);
    };
  }, [chatId, supabaseReady]);

  useEffect(() => {
    if (!chatId || !supabaseReady) return;

    let cancelled = false;

    const refreshMessages = async () => {
      const { data, error: refreshError } = await supabaseBrowserClient
        .from("messages")
        .select("id, chat_id, sender_id, sender_role, content, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .returns<MessageRow[]>();

      if (cancelled) return;

      if (refreshError) {
        setError(refreshError.message);
        return;
      }

      if (data) {
        setMessages(data);
      }
    };

    const interval = setInterval(refreshMessages, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chatId, supabaseReady]);

  const handleSend = async () => {
    if (!chatId || !input.trim()) return;
    
    if (input.trim().length > 2000) {
      setError("Message is too long (max 2000 characters).");
      return;
    }
    
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
  const price = formatPrice(property?.price);
  const otherName = otherProfile?.full_name?.trim() || "User";
  const otherInitials = otherName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const composerInputId = "chat-thread-message";
  const composerCountId = "chat-thread-message-count";

  return (
    <div className={`${editorialPageRootClass} flex flex-col`}>
      <HomeHeader />

      <main className="relative isolate mx-auto flex-1 w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(234,88,12,0.1),transparent_42%)]"
        />

        <div className="relative">
        <button
          type="button"
          onClick={() => router.push("/chats")}
          className={editorialButtonClass({
            tone: "secondary",
            size: "sm",
            className: "mb-4 gap-2 bg-white/80 font-medium",
          })}
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
          <EditorialNotice tone="error" className="mb-4">
            {error}
          </EditorialNotice>
        )}

        <EditorialCard className="rounded-[1.7rem] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="relative h-20 w-full overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#e7e2d8] sm:w-28"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute left-2 top-2 rounded-full border border-white/25 bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                Thread
              </div>
            </div>
            <div className="flex flex-1 items-center gap-4">
              <div
                className="relative h-12 w-12 overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#f8f3e7] text-sm font-semibold text-zinc-900"
                style={
                  otherProfile?.avatar_url
                    ? {
                        backgroundImage: `url(${otherProfile.avatar_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!otherProfile?.avatar_url && (
                  <div className="flex h-full w-full items-center justify-center">
                    {otherInitials || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-500">
                  Chat with {otherName}
                </p>
                <h1 className="text-xl font-semibold text-zinc-900">
                  {property?.title ?? "Property conversation"}
                </h1>
                <p className="text-sm text-zinc-700">
                  {property?.city ?? "Location pending"} - {price}
                </p>
              </div>
            </div>
            <Link
              href={property ? `/properties/${property.id}` : "/"}
              className={editorialButtonClass({
                tone: "secondary",
                size: "sm",
                className: "text-xs text-zinc-900",
              })}
            >
              View listing
            </Link>
          </div>
        </EditorialCard>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <EditorialCard className="flex h-[560px] flex-col overflow-hidden rounded-[1.7rem] bg-white/90 shadow-[0_20px_60px_-48px_rgba(0,0,0,0.4)]">
            <div className="border-b border-zinc-900/10 bg-[#faf5e9] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Conversation Feed
            </div>
            <div
              className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-5 md:py-5"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-busy={loading}
              aria-label="Conversation messages"
            >
              {loading && (
                <EditorialNotice className="rounded-xl text-zinc-700">
                  Loading chat...
                </EditorialNotice>
              )}
              {!loading && messages.length === 0 && (
                <EditorialNotice className="rounded-xl text-zinc-700">
                  No messages yet. Say hello to get started.
                </EditorialNotice>
              )}
              {!loading &&
                messages.map((message) => {
                  const isSelf = message.sender_id === userId;
                  const senderLabel = isSelf
                    ? "You"
                    : message.sender_id === chat?.agent_id
                      ? "Agent"
                      : "Buyer";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                          isSelf
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-900/10 bg-[#fbf8f0] text-zinc-900"
                        }`}
                      >
                        <div className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          isSelf ? "text-zinc-400" : "text-zinc-500"
                        }`}>
                          {senderLabel}
                        </div>
                        <p className="whitespace-pre-wrap break-words leading-6">
                          {message.content}
                        </p>
                        <span className={`mt-2 block text-[10px] ${
                          isSelf ? "text-zinc-400" : "text-zinc-500"
                        }`}>
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="border-t border-zinc-900/10 bg-white px-4 py-4 md:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor={composerInputId} className="sr-only">
                    Message
                  </label>
                  <textarea
                    id={composerInputId}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Write a message..."
                    maxLength={2000}
                    aria-describedby={composerCountId}
                    className="min-h-[92px] w-full resize-none rounded-2xl border border-zinc-900/10 bg-[#fbf8f0] px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900/25 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
                  />
                  <div id={composerCountId} className="mt-1 text-xs text-zinc-500 text-right">
                    {input.length}/2000
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  aria-label={sending ? "Sending message" : "Send message"}
                  className={editorialButtonClass({
                    tone: "primary",
                    className: "shrink-0 rounded-2xl px-5 disabled:opacity-60",
                  })}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </EditorialCard>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <EditorialCard className="rounded-[1.4rem] bg-white/90 p-5 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Chat Details
              </p>
              <div className="mt-4 space-y-3 text-xs text-zinc-700">
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
              <EditorialNotice className="mt-4 rounded-xl px-3 py-3 text-xs text-zinc-600">
                {otherName} is connected to this thread. New messages appear live when available.
              </EditorialNotice>
            </EditorialCard>
            <EditorialCard tone="dark" className="rounded-[1.4rem] p-5 text-xs text-[#e3d6c2] shadow-[0_16px_50px_-35px_rgba(0,0,0,0.5)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0c2aa]">
                Message Etiquette
              </p>
              <p className="mt-3 leading-6">
                Keep conversations respectful and specific. Share tour windows, budget constraints,
                and listing questions early.
              </p>
            </EditorialCard>
          </aside>
        </section>
        </div>
      </main>
    </div>
  );
}

