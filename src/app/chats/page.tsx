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

type MessageRow = {
  chat_id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

type ChatListItem = ChatRow & {
  property?: PropertyRow;
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

      const [propertyResponse, messageResponse] = await Promise.all([
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
      ]);

      if (cancelled) return;

      if (propertyResponse.error) {
        setError(propertyResponse.error.message);
      }

      const propertyMap = new Map(
        (propertyResponse.data ?? []).map((property) => [property.id, property]),
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Messages</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Keep track of your property conversations.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
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
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-neutral-400">
              Loading your chats...
            </div>
          )}

          {!loading && !error && chats.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-neutral-400">
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
              const priceNumber = Number(property?.price);
              const price = Number.isFinite(priceNumber)
                ? `$${priceNumber.toLocaleString()}`
                : property?.price
                  ? `$${property?.price}`
                  : "$0";
              const roleLabel =
                userId && chat.agent_id === userId ? "Buyer" : "Agent";

              return (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-neutral-900/60 p-4 transition hover:border-white/20 md:flex-row md:items-center"
                >
                  <div
                    className="h-20 w-full overflow-hidden rounded-2xl bg-neutral-800 md:h-16 md:w-24"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {property?.title ?? "Property conversation"}
                      </p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-300">
                        {roleLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      {property?.city ?? "Location pending"} - {price}
                    </p>
                    <p className="mt-2 text-sm text-neutral-300">
                      {chat.lastMessage?.content ?? "No messages yet."}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-500">
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
