import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BrowserSupabaseClient = SupabaseClient<any, "public", any>;

let browserClient: BrowserSupabaseClient | null = null;

function getSupabaseBrowserClient(): BrowserSupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Lazily initialize the browser client so importing this module during Next build
// (including server-side route analysis) does not fail before runtime checks.
export const supabaseBrowserClient = new Proxy({} as BrowserSupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
