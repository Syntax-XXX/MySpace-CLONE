"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

type FriendProfile = { id: string; username?: string | null; profile_picture?: string | null };

export default function FriendsPage() {
  const supabase = getSupabaseClient();
  const [list, setList] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setErr(null); setInfo(null);
      try {
        const u = (await supabase.auth.getUser()).data?.user;
        if (!u) throw new Error("Not signed in");
        // normalized friends(user_a,user_b)
        const { data: linksNorm } = await supabase
          .from("friends")
          .select("user_a,user_b")
          .or(`user_a.eq.${u.id},user_b.eq.${u.id}`);
        const idsNorm = (linksNorm || []).map((r: any) => (r.user_a === u.id ? r.user_b : r.user_a));
        // legacy fallback friends(user_id,friend_id,status='accepted')
        const { data: linksLegacy } = await supabase
          .from("friends")
          .select("user_id,friend_id,status")
          .eq("user_id", u.id)
          .eq("status", "accepted");
        const idsLegacy = (linksLegacy || []).map((r: any) => r.friend_id);
        const ids = Array.from(new Set([...(idsNorm || []), ...(idsLegacy || [])]));

        if (ids.length === 0) { setList([]); return; }
        const { data: profiles } = await supabase
          .from("users")
          .select("id, username, profile_picture")
          .in("id", ids);
        if (!mounted) return;
        setList(Array.isArray(profiles) ? profiles : []);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load friends");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  async function unfriend(friendId: string) {
    setErr(null); setInfo(null);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      if (!token) throw new Error("No token");
      const res = await fetch("/api/friends/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Unfriend failed");
      setInfo("Friend removed");
      setList(prev => prev.filter(p => p.id !== friendId));
    } catch (e: any) {
      setErr(e?.message || "Unfriend failed");
    }
  }

  return (
    <div className="classic-container">
      <div className="classic-grid">
        <aside className="sidebar-left">
          <div className="module">
            <div className="module-title">Friends</div>
            <div className="module-body">
              <div className="text-sm text-gray-700">Manage your connections</div>
              <ul className="list-compact mt-2">
                <li><Link className="myspace-link" href="/friends/requests">Friend Requests</Link></li>
                <li><Link className="myspace-link" href="/friends/top8">Top 8 Editor</Link></li>
              </ul>
            </div>
          </div>
        </aside>
        <main>
          <section className="module">
            <div className="module-title">Your Friends</div>
            <div className="module-body">
              {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
              {info && <div className="text-green-700 text-sm mb-2">{info}</div>}
              {loading ? (
                <div>Loading…</div>
              ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">No friends to show.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {list.map(f => (
                    <div key={f.id} className="card flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/avatars/${f.id}`} alt="avatar" className="avatar" />
                      <div className="text-sm text-center w-full truncate">{f.username || f.id}</div>
                      <div className="flex gap-2">
                        <Link className="btn btn-secondary" href={`/profile/${f.username || f.id}`}>View</Link>
                        <button className="btn btn-primary" onClick={() => unfriend(f.id)}>Unfriend</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
