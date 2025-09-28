"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabaseClient";

/**
 * This page receives the redirect from the Supabase confirmation email.
 * It extracts access_token/refresh_token from the URL (query or hash),
 * sets the client session, calls the server create-profile endpoint, then
 * routes the user to profile creation or their profile.
 */
export default function VerifyCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying...");
  const [mode, setMode] = useState<"verifying" | "recovery" | "done" | "error">("verifying");
  const [newPassword, setNewPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Supabase not configured");

        // Parse tokens from either query string or fragment (#)
        const search = window.location.search || "";
        const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
        const combined = (search ? search.replace(/^\?/, "") + "&" : "") + hash;
        const params = new URLSearchParams(combined);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const error_description = params.get("error_description");

        if (error_description) throw new Error(error_description);
        if (!access_token) {
          setStatus("No token found. Please sign in manually.");
          setTimeout(() => router.replace("/auth/login"), 1500);
          return;
        }

        // Set client session
        await supabase.auth.setSession({ 
          access_token, 
          refresh_token: refresh_token || '' 
        });
        console.debug("Session set from verify callback");

        const urlType = params.get("type") || params.get("token_type");
        if (urlType === "recovery") {
          setStatus("Reset your password");
          setMode("recovery");
          return;
        }

        // Call server to ensure profile exists
        const resp = await fetch("/api/create-profile", {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}` },
        });
        console.debug("/api/create-profile", await resp.text());

        // remove tokens from URL to avoid leaking them or triggering extensions
        try {
          const cleanUrl = window.location.pathname + window.location.search;
          history.replaceState(null, "", cleanUrl);
          // fallback
          if (window.location.hash) window.location.hash = "";
        } catch (e) {
          console.warn("Failed to clean URL fragment", e);
        }

        // Get logged-in user
        const userResp = await supabase.auth.getUser();
        const user = userResp?.data?.user;
        if (!user) {
          setStatus("Logged in but no user found.");
          setTimeout(() => router.replace("/"), 1200);
          return;
        }

        // Redirect to profile completion or profile
        router.replace(`/auth/create-profile?user=${user.id}`);
      } catch (err: any) {
        console.error("VerifyCallback error:", err);
        setStatus(err?.message || "Verification failed");
        setTimeout(() => router.replace("/auth/login"), 1800);
      }
    }

    run();
  }, [router]);

  return (
    <div className="p-6">
      {mode === "recovery" ? (
        <form
          className="max-w-md space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setPwErr(null);
            setPwSubmitting(true);
            try {
              const supabase = getSupabaseClient();
              if (!supabase) throw new Error("Supabase not configured");
              if (!newPassword || newPassword.length < 8) throw new Error("Password must be at least 8 characters");
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
              setStatus("Password updated. Redirecting...");
              setMode("done");
              const userResp = await supabase.auth.getUser();
              const userId = userResp?.data?.user?.id;
              setTimeout(() => {
                if (userId) window.location.replace(`/profile/${userId}`);
                else window.location.replace("/");
              }, 800);
            } catch (err: any) {
              setPwErr(err?.message || "Update failed");
            } finally {
              setPwSubmitting(false);
            }
          }}
        >
          <div className="text-lg font-semibold">Set a new password</div>
          <input
            className="input w-full"
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button className="btn btn-primary" disabled={pwSubmitting}>
            {pwSubmitting ? "Updating…" : "Update password"}
          </button>
          {pwErr && <div className="text-red-600 text-sm">{pwErr}</div>}
        </form>
      ) : (
        status
      )}
    </div>
  );
}