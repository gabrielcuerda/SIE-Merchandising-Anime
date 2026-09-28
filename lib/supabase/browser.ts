import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const [supabaseUrl, supabaseKey] = requireSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
