"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import ModernProfileView from "../../../components/ModernProfileView";

const isUuid = (s?: string) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

export default function ProfilePage() {
  const params = useParams();
  const param = params?.username as string | undefined;
  const supabase = getSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!param || !supabase) return;

    const resolveUserId = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        let resolvedUserId: string;

        if (isUuid(param)) {
          resolvedUserId = param;
        } else {
          // Query by username
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("username", param)
            .single();

          if (userError || !userData) {
            setError("Profile not found");
            return;
          }

          resolvedUserId = userData.id;
        }

        setUserId(resolvedUserId);
        setIsOwnProfile(user?.id === resolvedUserId);

      } catch (err: any) {
        console.error("Error resolving user ID:", err);
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    resolveUserId();
  }, [param, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The profile you're looking for doesn't exist."}</p>
          <a href="/" className="btn btn-primary">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <ModernProfileView userId={userId} isOwnProfile={isOwnProfile} />;
}