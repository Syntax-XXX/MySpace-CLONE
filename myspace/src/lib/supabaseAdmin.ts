import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole);
}