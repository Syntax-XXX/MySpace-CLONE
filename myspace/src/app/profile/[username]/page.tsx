"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import ProfileCard from "../../../components/ProfileCard";
import FriendsGrid from "../../../components/FriendsGrid";

type Profile = {
  id: string;
  username: string;
  bio?: string;
  profile_picture?: string;
  background_style?: string;
};

const isUuid = (s?: string) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

export default function ProfilePageClient() {
  const params = useParams();
  const param = params?.username as string | undefined;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!param) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Supabase not configured");

        // If param looks like a UUID, query by id; otherwise query by username
        let query = supabase.from("users").select("id, username, bio, profile_picture, background_style").limit(1);
        if (isUuid(param)) {
          query = (query as any).eq("id", param).maybeSingle();
        } else {
          query = (query as any).eq("username", param).maybeSingle();
        }

        const { data: userRow, error: userErr } = await query;
        if (userErr) throw userErr;
        if (!userRow) {
          setError("Profile not found");
          setProfile(null);
          setFriends([]);
          return;
        }
        if (!mounted) return;
        setProfile(userRow);

        // fetch friends
        const { data: friendRows, error: friendErr } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", userRow.id)
          .eq("status", "accepted");

        if (friendErr) throw friendErr;

        if (friendRows && friendRows.length > 0) {
          const friendIds = friendRows.map((r: any) => r.friend_id);
          const { data: friendProfiles } = await supabase
            .from("users")
            .select("id, username, profile_picture")
            .in("id", friendIds);
          if (mounted) setFriends(Array.isArray(friendProfiles) ? friendProfiles : []);
        } else {
          if (mounted) setFriends([]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [param]);

  if (!param) return <div className="p-6">No username provided.</div>;
  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!profile) return <div className="p-6">Profile not found.</div>;

  return (
    <div className="classic-container">
      <div className="classic-grid">
        <aside className="sidebar-left">
          <div className="module">
            <div className="module-title">Profile</div>
            <div className="module-body">
              <ProfileCard profile={profile} />
            </div>
          </div>
        </aside>
        <main>
          <section className="module">
            <div className="module-title">Friends</div>
            <div className="module-body">
              <FriendsGrid friends={friends} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}