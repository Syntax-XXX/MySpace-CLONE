"use client";
import React, { useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

async function createProfileWithToken(token: string) {
  return fetch("/api/create-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const token = (data as any)?.session?.access_token;
      const userId = (data as any)?.user?.id ?? (await supabase.auth.getUser()).data?.user?.id;

      if (token) await createProfileWithToken(token);

      if (userId) {
        router.replace(`/profile/${userId}`);
      } else {
        router.replace("/");
      }
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Log in to MySpace</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <button className="bg-[#1e90ff] text-white px-3 py-1 rounded" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            {err && <span className="text-sm text-red-600">{err}</span>}
          </div>

          <div className="flex items-center justify-between text-sm mt-2">
            <button
              type="button"
              className="underline"
              onClick={async () => {
                setActionMsg(null);
                setActionErr(null);
                try {
                  const supabase = getSupabaseClient();
                  if (!supabase) throw new Error("Supabase not configured");
                  const emailInput = window.prompt("Enter your email to reset password:")?.trim();
                  if (!emailInput) return;
                  const redirectTo = `${window.location.origin}/auth/verify-callback`;
                  const { error } = await supabase.auth.resetPasswordForEmail(emailInput, { redirectTo });
                  if (error) throw error;
                  setActionMsg("Password reset email sent.");
                } catch (e: any) {
                  setActionErr(e?.message || "Failed to send reset email");
                }
              }}
            >
              Forgot password?
            </button>

            <button
              type="button"
              className="underline"
              onClick={async () => {
                setActionMsg(null);
                setActionErr(null);
                try {
                  const supabase = getSupabaseClient();
                  if (!supabase) throw new Error("Supabase not configured");
                  const emailInput = window.prompt("Enter your email to resend confirmation:")?.trim();
                  if (!emailInput) return;
                  const redirectTo = `${window.location.origin}/auth/verify-callback`;
                  const { error } = await supabase.auth.resend({ type: "signup", email: emailInput, options: { emailRedirectTo: redirectTo } as any } as any);
                  if (error) throw error;
                  setActionMsg("Confirmation email re-sent.");
                } catch (e: any) {
                  setActionErr(e?.message || "Failed to resend confirmation");
                }
              }}
            >
              Resend confirmation
            </button>
          </div>

          {actionMsg && <div className="text-green-700 text-sm">{actionMsg}</div>}
          {actionErr && <div className="text-red-600 text-sm">{actionErr}</div>}
        </form>
      </div>
    </div>
  );
}
