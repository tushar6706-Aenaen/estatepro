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
  const priceNumber = Number(property?.price);
  const price = Number.isFinite(priceNumber)
    ? `$${priceNumber.toLocaleString()}`
    : property?.price
      ? `$${property?.price}`
      : "$0";
  const otherName = otherProfile?.full_name?.trim() || "User";
  const otherInitials = otherName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <button
          type="button"
          onClick={() => router.push("/chats")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900"
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
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-gray-300 bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="h-16 w-24 overflow-hidden rounded-2xl bg-gray-200"
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
            <div className="flex flex-1 items-center gap-4">
              <div
                className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-300 bg-gray-200 text-sm font-semibold text-gray-900"
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
                <p className="text-sm text-gray-500">
                  Chat with {otherName}
                </p>
                <h1 className="text-xl font-semibold text-gray-900">
                  {property?.title ?? "Property conversation"}
                </h1>
                <p className="text-sm text-gray-800">
                  {property?.city ?? "Location pending"} - {price}
                </p>
              </div>
            </div>
            <Link
              href={property ? `/properties/${property.id}` : "/"}
              className="rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 transition hover:border-gray-900 hover:bg-gray-50"
            >
              View listing
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex h-[520px] flex-col rounded-3xl border border-gray-300 bg-white">
            <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {loading && (
                <div className="text-sm text-gray-700">Loading chat...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="text-sm text-gray-700">
                  No messages yet. Say hello to get started.
                </div>
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
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          isSelf
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          isSelf ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {senderLabel}
                        </div>
                        <p>{message.content}</p>
                        <span className={`mt-2 block text-[10px] ${
                          isSelf ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="border-t border-gray-300 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Write a message..."
                    maxLength={2000}
                    className="min-h-[80px] w-full resize-none rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {input.length}/2000
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Chat details</h2>
              <div className="mt-4 space-y-3 text-xs text-gray-700">
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
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-5 text-xs text-gray-700">
              Keep conversations respectful. Listings are updated regularly.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
