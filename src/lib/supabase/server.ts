import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 * Uses browser-safe anon key by default; swap to service role only inside trusted server code.
 */
export function createSupabaseServerClient(opts?: { useServiceRole?: boolean }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const key =
    opts?.useServiceRole && serviceRoleKey ? serviceRoleKey : anonKey;

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
