"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const search = useSearchParams();
  const preUserId = search?.get("user") || undefined;

  const [userId, setUserId] = useState<string | undefined>(preUserId);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      if (!supabase) return;
      try {
        const resp = await supabase.auth.getUser();
        const u = resp?.data?.user;
        if (u) setUserId(u.id);
        else if (!preUserId) router.replace("/auth/login");
      } catch {
        if (!preUserId) router.replace("/auth/login");
      }
    }
    fetchUser();
  }, [preUserId, router, supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!userId) throw new Error("No user ID");

      // Upsert user profile (anon key allowed to update own profile)
      const { error } = await supabase
        .from("users")
        .upsert({ id: userId, username, bio }, { onConflict: "id" });

      if (error) throw error;

      router.replace(`/profile/${userId}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Complete your profile</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <button
              className="bg-[#1e90ff] text-white px-3 py-1 rounded"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save profile"}
            </button>
            {err && (
              <span className="text-sm text-red-600">{err}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}