"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
import {
  EditorialBackdrop,
  EditorialCard,
  EditorialNotice,
  EditorialPill,
  editorialButtonClass,
  editorialPageRootClass,
} from "@/src/components/ui/editorial";
import { supabaseBrowserClient } from "@/src/lib/supabase/client";

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
  chat_id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

type ChatListItem = ChatRow & {
  property?: PropertyRow;
  participant?: ProfileRow;
  lastMessage?: MessageRow;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
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

export default function ChatsPage() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadChats = async () => {
      if (!supabaseReady) {
        setError("Supabase environment variables are missing in .env.local.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: authData, error: authError } =
        await supabaseBrowserClient.auth.getUser();

      if (authError || !authData.user) {
        setError("Sign in to view your messages.");
        setLoading(false);
        return;
      }

      const currentUserId = authData.user.id;
      setUserId(currentUserId);

      const { data: chatRows, error: chatError } =
        await supabaseBrowserClient
          .from("chats")
          .select("id, property_id, agent_id, user_id, created_at")
          .or(`user_id.eq.${currentUserId},agent_id.eq.${currentUserId}`)
          .order("created_at", { ascending: false })
          .returns<ChatRow[]>();

      if (cancelled) return;

      if (chatError) {
        setError(chatError.message);
        setLoading(false);
        return;
      }

      const chatList = chatRows ?? [];
      if (chatList.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const propertyIds = Array.from(
        new Set(chatList.map((chat) => chat.property_id)),
      );
      const chatIds = chatList.map((chat) => chat.id);
      const participantIds = Array.from(
        new Set(
          chatList.map((chat) =>
            chat.user_id === currentUserId ? chat.agent_id : chat.user_id,
          ),
        ),
      );

      const [propertyResponse, messageResponse, profileResponse] = await Promise.all([
        supabaseBrowserClient
          .from("properties")
          .select("id, title, city, price, property_images(image_url, is_primary)")
          .in("id", propertyIds)
          .returns<PropertyRow[]>(),
        supabaseBrowserClient
          .from("messages")
          .select("chat_id, content, created_at, sender_id")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
          .returns<MessageRow[]>(),
        supabaseBrowserClient
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", participantIds)
          .returns<ProfileRow[]>(),
      ]);

      if (cancelled) return;

      if (propertyResponse.error) {
        setError(propertyResponse.error.message);
      }

      if (profileResponse.error) {
        setError(profileResponse.error.message);
      }

      const propertyMap = new Map(
        (propertyResponse.data ?? []).map((property) => [property.id, property]),
      );

      const profileMap = new Map(
        (profileResponse.data ?? []).map((profile) => [profile.id, profile]),
      );

      const lastMessageMap = new Map<string, MessageRow>();
      (messageResponse.data ?? []).forEach((message) => {
        if (!lastMessageMap.has(message.chat_id)) {
          lastMessageMap.set(message.chat_id, message);
        }
      });

      const combined = chatList.map((chat) => ({
        ...chat,
        property: propertyMap.get(chat.property_id),
        participant: profileMap.get(
          chat.user_id === currentUserId ? chat.agent_id : chat.user_id,
        ),
        lastMessage: lastMessageMap.get(chat.id),
      }));

      setChats(combined);
      setLoading(false);
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  useEffect(() => {
    if (!supabaseReady || !userId) return;

    let cancelled = false;

    const fetchChatExtras = async (chat: ChatRow) => {
      const otherId = chat.user_id === userId ? chat.agent_id : chat.user_id;
      const [propertyResponse, profileResponse] = await Promise.all([
        supabaseBrowserClient
          .from("properties")
          .select("id, title, city, price, property_images(image_url, is_primary)")
          .eq("id", chat.property_id)
          .maybeSingle<PropertyRow>(),
        supabaseBrowserClient
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .eq("id", otherId)
          .maybeSingle<ProfileRow>(),
      ]);

      if (cancelled) return;

      setChats((prev) => {
        const existing = prev.find((item) => item.id === chat.id);
        const updated: ChatListItem = {
          ...chat,
          property: propertyResponse.data ?? existing?.property,
          participant: profileResponse.data ?? existing?.participant,
          lastMessage: existing?.lastMessage,
        };

        return [updated, ...prev.filter((item) => item.id !== chat.id)];
      });
    };

    const channel = supabaseBrowserClient
      .channel(`chat-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        (payload) => {
          const incoming = payload.new as ChatRow;
          if (incoming.user_id !== userId && incoming.agent_id !== userId) {
            return;
          }
          void fetchChatExtras(incoming);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as MessageRow;

          setChats((prev) => {
            const target = prev.find((chat) => chat.id === incoming.chat_id);
            if (!target) return prev;
            const updated = { ...target, lastMessage: incoming };
            return [updated, ...prev.filter((chat) => chat.id !== incoming.chat_id)];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabaseBrowserClient.removeChannel(channel);
    };
  }, [supabaseReady, userId]);

  return (
    <div className={`${editorialPageRootClass} flex flex-col`}>
      <HomeHeader />

      <main className="relative isolate mx-auto flex-1 w-full max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
        <EditorialBackdrop
          radialClassName="bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_88%_16%,rgba(234,88,12,0.1),transparent_42%)]"
        />

        <EditorialCard className="relative p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Inbox Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-950 md:text-4xl">
                Messages
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
              Keep track of your property conversations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <EditorialPill tone="soft" className="py-1.5">
                {loading ? "..." : `${chats.length} chats`}
              </EditorialPill>
              <Link
                href="/"
                className={editorialButtonClass({
                  tone: "secondary",
                  size: "sm",
                  className: "text-zinc-900",
                })}
              >
                Browse listings
              </Link>
            </div>
          </div>

          {error && (
            <EditorialNotice tone="error" className="mt-6">
              {error}
            </EditorialNotice>
          )}

          <section
            className="mt-6 space-y-4"
            aria-label="Conversation list"
            aria-busy={loading}
          >
            {loading && (
              <EditorialNotice className="py-6 text-zinc-700">
                Loading your chats...
              </EditorialNotice>
            )}

            {!loading && !error && chats.length === 0 && (
              <EditorialNotice className="py-6 text-zinc-700">
                You do not have any chats yet. Message an agent from a property
                page to get started.
              </EditorialNotice>
            )}

          {!loading &&
            chats.map((chat) => {
              const property = chat.property;
              const primaryImage =
                property?.property_images?.find((img) => img.is_primary) ??
                property?.property_images?.[0];
              const roleLabel =
                userId && chat.agent_id === userId ? "Buyer" : "Agent";
              const participantName =
                chat.participant?.full_name?.trim() || "User";
              const priceLabel = formatPrice(property?.price);
              const lastMessagePreview = chat.lastMessage?.content ?? "No messages yet.";
              const initials = participantName
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  aria-label={`Open chat with ${participantName} about ${property?.title ?? "property conversation"} in ${property?.city ?? "unknown location"}`}
                  className="group block rounded-[1.35rem] border border-zinc-900/10 bg-white/90 p-4 shadow-[0_14px_45px_-38px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-zinc-900/20 hover:bg-white"
                >
                  <div className="grid gap-4 md:grid-cols-[112px_1fr_auto] md:items-center">
                    <div
                      className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#e7e2d8] md:h-20 md:w-28"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
                      <div className="absolute left-2 top-2 rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        Chat
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3 md:gap-4">
                      <div
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#f8f3e7] text-sm font-semibold text-zinc-900"
                        style={
                          chat.participant?.avatar_url
                            ? {
                                backgroundImage: `url(${chat.participant.avatar_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      >
                        {!chat.participant?.avatar_url && (
                          <div className="flex h-full w-full items-center justify-center">
                            {initials || "U"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {participantName}
                          </p>
                          <EditorialPill tone="soft" className="px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                            {roleLabel}
                          </EditorialPill>
                          <EditorialPill className="px-2 py-0.5 text-[10px]">
                            {priceLabel}
                          </EditorialPill>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-600">
                          {property?.title ?? "Property conversation"} - {property?.city ?? "Location pending"}
                        </p>
                        <p className="mt-2 line-clamp-2 break-words text-sm text-zinc-800">
                          {lastMessagePreview}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 md:block md:text-right">
                      <div className="rounded-full border border-zinc-900/10 bg-[#fbf8f0] px-3 py-1 text-xs font-medium text-zinc-600">
                        {formatDate(chat.lastMessage?.created_at ?? chat.created_at)}
                      </div>
                      <div className="mt-2 hidden text-xs font-medium text-zinc-500 md:block">
                        Open thread
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        </EditorialCard>
      </main>
    </div>
  );
}

