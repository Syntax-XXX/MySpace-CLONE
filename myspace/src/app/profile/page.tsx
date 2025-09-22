"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../../lib/supabaseClient";

export default function MyProfileRedirect() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    async function go() {
      if (!supabase) {
        router.replace("/auth/login");
        return;
      }
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      // Prefer username if available in profiles table; fall back to user id
      const { data: profile } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      const slug = profile?.username || user.id;
      router.replace(`/profile/${slug}`);
    }
    go();
  }, [router, supabase]);

  return <div className="p-6">Loading your profile…</div>;
}
