"use client";

import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/supabase/env";

const [supabaseUrl, supabaseKey] = requireSupabaseEnv();

export const supabase = createClient(supabaseUrl, supabaseKey);

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
