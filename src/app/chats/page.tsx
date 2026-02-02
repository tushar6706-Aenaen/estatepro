"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeHeader } from "@/src/components/layout/home-header";
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-2 text-sm text-gray-600">
              Keep track of your property conversations.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-gray-900 hover:bg-gray-50"
          >
            Browse listings
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <section className="mt-8 space-y-4">
          {loading && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              Loading your chats...
            </div>
          )}

          {!loading && !error && chats.length === 0 && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              You do not have any chats yet. Message an agent from a property
              page to get started.
            </div>
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
                  className="group flex flex-col gap-4 rounded-3xl border-2 border-gray-200 bg-white p-4 transition hover:border-gray-900 hover:shadow-md md:flex-row md:items-center"
                >
                  <div
                    className="h-20 w-full overflow-hidden rounded-2xl bg-gray-200 md:h-16 md:w-24"
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
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {participantName}
                        </p>
                        <span className="rounded-full border-2 border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-700">
                          {roleLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {property?.title ?? "Property conversation"} -{" "}
                        {property?.city ?? "Location pending"}
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-800">
                        {chat.lastMessage?.content ?? "No messages yet."}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(chat.lastMessage?.created_at ?? chat.created_at)}
                  </div>
                </Link>
              );
            })}
        </section>
      </main>
    </div>
  );
}
