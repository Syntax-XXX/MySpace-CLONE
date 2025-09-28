"use client";
import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

interface Friend { id: string; username?: string | null; profile_picture?: string | null; }

export default function Top8EditorPage() {
  const supabase = getSupabaseClient();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [order, setOrder] = useState<string[]>([]); // selected up to 8
  const [dragId, setDragId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setMessage(null); setError(null);
      try {
        if (!supabase) throw new Error("Supabase not configured");
        const u = (await supabase.auth.getUser()).data?.user;
        if (!u) throw new Error("Not signed in");
        const { data: friendLinks } = await supabase
          .from("friends")
          .select("user_a, user_b")
          .or(`user_a.eq.${u.id},user_b.eq.${u.id}`);
        const ids = (friendLinks || []).map((r: any) => (r.user_a === u.id ? r.user_b : r.user_a));
        const { data: rows } = await supabase.from("users").select("id, username, profile_picture").in("id", ids);
        if (!mounted) return;
        setFriends(Array.isArray(rows) ? rows : []);
        // Load current top8 from profile if exists
        const { data: me } = await supabase.from("users").select("top8").eq("id", u.id).maybeSingle();
        if (me?.top8 && Array.isArray(me.top8)) setOrder(me.top8.slice(0, 8));
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load friends");
      }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  function onDragStart(id: string) { setDragId(id); }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setOrder(prev => {
      const arr = prev.length ? [...prev] : friends.map(f => f.id).slice(0,8);
      const from = arr.indexOf(dragId);
      const to = arr.indexOf(targetId);
      if (from === -1 || to === -1) return arr;
      const [m] = arr.splice(from,1);
      arr.splice(to,0,m);
      return arr.slice(0,8);
    });
    setDragId(null);
  }

  async function save() {
    setMessage(null); setError(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      if (!token) throw new Error("No token");
      const res = await fetch("/api/set-top8",{ method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ top8: order.slice(0,8) }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setMessage("Top 8 saved");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    }
  }

  const display = order.length ? order : friends.map(f=>f.id).slice(0,8);
  const byId = new Map(friends.map(f=>[f.id, f] as const));

  return (
    <div className="classic-container">
      <div className="module">
        <div className="module-title">Top Friends (Top 8)</div>
        <div className="module-body">
          <p className="text-sm text-gray-700 mb-3">Drag to reorder your top friends. Maximum of 8.</p>
          {message && <div className="text-green-700 text-sm mb-2">{message}</div>}
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {display.map(id => {
              const f = byId.get(id);
              if (!f) return null;
              return (
                <div key={id}
                  draggable
                  onDragStart={() => onDragStart(id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(id)}
                  className="card flex flex-col items-center cursor-move select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.profile_picture || "/default-avatar.png"} alt={f.username || "Friend"} className="avatar mb-2" />
                  <div className="text-sm text-center">{f.username || id}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <a className="btn btn-secondary" href="/profile">Back to Profile</a>
          </div>
        </div>
      </div>
    </div>
  );
}
