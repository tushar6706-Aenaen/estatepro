"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  sender_role: "user" | "agent";
  created_at: string;
};

type Props = {
  propertyId: string;
  agentId: string;
  agentName: string;
};

export function ChatPanel({ propertyId, agentId, agentName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function init() {
      setInitializing(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNeedsAuth(true);
        setInitializing(false);
        return;
      }

      setUserId(user.id);

      const { data: existingChat, error } = await supabase
        .from("chats")
        .select("id")
        .eq("property_id", propertyId)
        .eq("agent_id", agentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setInitializing(false);
        return;
      }

      let finalChatId = existingChat?.id;

      if (!finalChatId) {
        const { data: newChat, error: createError } = await supabase
          .from("chats")
          .insert({
            property_id: propertyId,
            agent_id: agentId,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (createError) {
          setInitializing(false);
          return;
        }

        finalChatId = newChat.id;
      }

      if (!finalChatId || isCancelled) {
        setInitializing(false);
        return;
      }

      setChatId(finalChatId);

      const { data: initialMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", finalChatId)
        .order("created_at", { ascending: true });

      if (!isCancelled && initialMessages) {
        setMessages(initialMessages as Message[]);
      }

      const channel = supabase
        .channel(`chat-${finalChatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${finalChatId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      setInitializing(false);

      return () => {
        supabase.removeChannel(channel);
      };
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [open, agentId, propertyId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !chatId || !userId) return;

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: userId,
      sender_role: "user",
      content: input.trim(),
    });

    setInput("");
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-900"
      >
        Chat with agent
      </button>
    );
  }

  if (needsAuth) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm">
        <p className="mb-2 font-semibold tracking-tight">Chat with agent</p>
        <p className="mb-3 text-xs text-neutral-600">
          You need an account to start a chat.
        </p>
        <a
          href="/auth/sign-in"
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
        >
          Sign in to chat
        </a>
      </div>
    );
  }

  return (
    <div className="flex max-h-80 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-tight">
            Chat with {agentName}
          </span>
          <span className="text-[11px] text-neutral-500">
            Usually replies within a few hours
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-neutral-500 hover:text-neutral-800"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-xs">
        {initializing && (
          <p className="text-neutral-500">Loading conversation...</p>
        )}
        {!initializing && messages.length === 0 && (
          <p className="text-neutral-500">
            Start the conversation by saying hello.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-2 py-1 ${
                m.sender_role === "user"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              <p>{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-neutral-200 px-3 py-2"
      >
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !chatId}
          className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Send
        </button>
      </form>
    </div>
  );
}

