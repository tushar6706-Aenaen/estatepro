import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { sanitizeString } from "@/src/lib/validation";

export type ChatRow = {
  id: string;
  property_id: string;
  agent_id: string;
  user_id: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
};

const ensureSupabaseReady = () => {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
};

const asError = (message: string) => ({ message });

const getAuthedUserId = async () => {
  if (!ensureSupabaseReady()) {
    return { userId: null, error: asError("Supabase env vars are missing.") };
  }

  const { data, error } = await supabaseBrowserClient.auth.getUser();
  if (error || !data.user) {
    return { userId: null, error: asError("Sign in required.") };
  }
  return { userId: data.user.id, error: null };
};

const getUserRole = async (userId: string) => {
  const { data, error } = await supabaseBrowserClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>();

  if (error) {
    return { role: "public", error };
  }

  return { role: data?.role ?? "public", error: null };
};

export const createOrGetChat = async (params: {
  propertyId: string;
  agentId: string;
}) => {
  const { userId, error: authError } = await getAuthedUserId();
  if (!userId || authError) {
    return { data: null, error: authError };
  }

  const { data: existing, error: existingError } =
    await supabaseBrowserClient
      .from("chats")
      .select("id, property_id, agent_id, user_id, created_at")
      .eq("property_id", params.propertyId)
      .eq("agent_id", params.agentId)
      .eq("user_id", userId)
      .maybeSingle<ChatRow>();

  if (existingError) {
    return { data: null, error: existingError };
  }

  if (existing) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabaseBrowserClient
    .from("chats")
    .insert({
      property_id: params.propertyId,
      agent_id: params.agentId,
      user_id: userId,
    })
    .select("id, property_id, agent_id, user_id, created_at")
    .single<ChatRow>();

  return { data, error };
};

export const listChatsForUser = async () => {
  const { userId, error: authError } = await getAuthedUserId();
  if (!userId || authError) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabaseBrowserClient
    .from("chats")
    .select("id, property_id, agent_id, user_id, created_at")
    .or(`user_id.eq.${userId},agent_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .returns<ChatRow[]>();

  return { data, error };
};

export const listMessages = async (chatId: string) => {
  const { data, error } = await supabaseBrowserClient
    .from("messages")
    .select("id, chat_id, sender_id, sender_role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  return { data, error };
};

export const sendMessage = async (params: {
  chatId: string;
  content: string;
  senderRole?: string;
}) => {
  const trimmed = params.content.trim();
  if (!trimmed) {
    return { data: null, error: asError("Message cannot be empty.") };
  }

  if (trimmed.length > 2000) {
    return {
      data: null,
      error: asError("Message is too long (max 2000 characters)."),
    };
  }

  const sanitized = sanitizeString(trimmed);

  const { userId, error: authError } = await getAuthedUserId();
  if (!userId || authError) {
    return { data: null, error: authError };
  }

  let senderRole = params.senderRole;
  if (!senderRole) {
    const roleResponse = await getUserRole(userId);
    senderRole = roleResponse.role;
  }

  const { data, error } = await supabaseBrowserClient
    .from("messages")
    .insert({
      chat_id: params.chatId,
      sender_id: userId,
      sender_role: senderRole ?? "public",
      content: sanitized,
    })
    .select("id, chat_id, sender_id, sender_role, content, created_at")
    .single<MessageRow>();

  return { data, error };
};
