"use client";
import React, { useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      // Ensure redirect goes back to our verify callback which will auto-log-in
      const redirectTo = `${window.location.origin}/auth/verify-callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) throw error;

      // If signup returns a session (rare with email verification flow) redirect to profile
      const token = (data as any)?.session?.access_token;
      const userId = (data as any)?.user?.id;
      if (token && userId) {
        // create-profile endpoint will upsert profile for this user
        await fetch("/api/create-profile", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        router.replace(`/profile/${userId}`);
        return;
      }

      // Otherwise instruct user to check email; verify-callback will handle when they click the link.
      router.replace("/?notice=check-your-email");
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Create a MySpace account</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex items-center justify-between">
            <button className="bg-[#1e90ff] text-white px-3 py-1 rounded" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
            {err && <span className="text-sm text-red-600">{err}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
