import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Avoid throwing at module import time so Next.js SSR/build doesn't crash
 * when environment variables aren't loaded. Callers must handle a null return.
 */
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  if (!url || !anonKey) return null;
  _supabase = createClient(url, anonKey);
  return _supabase;
}