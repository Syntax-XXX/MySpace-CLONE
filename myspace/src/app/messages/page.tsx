"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";

interface MessageRow {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
}
interface FriendRow { id: string; username?: string | null; profile_picture?: string | null; }

export default function MessagesPage() {
  const supabase = getSupabaseClient();
  const [me, setMe] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [conversation, setConversation] = useState<MessageRow[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const user = (await supabase.auth.getUser()).data?.user;
        if (!user) {
          setError("Not signed in");
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setMe(user.id);

        // Load friends
        const { data: friendLinks, error: fErr } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");
        if (fErr) throw fErr;
        const ids = (friendLinks || []).map((r: any) => r.friend_id);
        const { data: rows } = await supabase
          .from("users")
          .select("id, username, profile_picture")
          .in("id", ids);
        setFriends(Array.isArray(rows) ? rows : []);

        // Preselect first friend if any
        if (rows && rows.length > 0) setSelected(rows[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load messages");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; channelRef.current?.unsubscribe?.(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !me || !selected) return;
    let mounted = true;

    async function loadConversation() {
      const { data, error } = await supabase
        .from("messages")
        .select("id,from_user,to_user,body,created_at")
        .or(`and(from_user.eq.${me},to_user.eq.${selected}),and(from_user.eq.${selected},to_user.eq.${me})`)
        .order("created_at", { ascending: true });
      if (error) return setError(error.message);
      if (!mounted) return;
      setConversation((data as MessageRow[]) || []);
    }

    function subscribe() {
      const channel = supabase
        .channel(`messages_${me}_${selected}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const m = payload.new as MessageRow;
            if ((m.from_user === me && m.to_user === selected) || (m.from_user === selected && m.to_user === me)) {
              setConversation(prev => [...prev, m]);
            }
          }
        )
        .subscribe();
      channelRef.current = channel;
    }

    channelRef.current?.unsubscribe?.();
    loadConversation();
    subscribe();

    return () => { mounted = false; channelRef.current?.unsubscribe?.(); };
  }, [supabase, me, selected]);

  const selectedFriend = useMemo(() => friends.find(f => f.id === selected) || null, [friends, selected]);

  async function send() {
    try {
      if (!supabase || !me || !selected) return;
      const { error } = await supabase
        .from("messages")
        .insert([{ from_user: me, to_user: selected, body }]);
      if (error) throw error;
      setBody("");
    } catch (e: any) {
      setError(e?.message || "Send failed");
    }
  }

  if (loading) return <div className="p-6">Loading messages...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {/* Friends list */}
      <aside className="card">
        <h3 className="font-semibold mb-2">Friends</h3>
        {friends.length === 0 ? (
          <div className="text-sm text-gray-600">No friends yet.</div>
        ) : (
          <ul className="divide-y">
            {friends.map((f) => (
              <li key={f.id}>
                <button
                  className={`w-full text-left px-2 py-2 hover:bg-gray-50 ${selected === f.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelected(f.id)}
                >
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.profile_picture || "/default-avatar.png"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm">{f.username || f.id}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Conversation */}
      <section className="card md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{selectedFriend ? `Chat with ${selectedFriend.username || selectedFriend.id}` : 'Select a friend'}</h3>
        </div>
        <div className="h-80 overflow-y-auto border rounded p-3 bg-white/50">
          {conversation.length === 0 ? (
            <div className="text-sm text-gray-600">No messages.</div>
          ) : (
            <ul className="space-y-2">
              {conversation.map(m => (
                <li key={m.id} className={`max-w-[80%] p-2 rounded ${m.from_user === me ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'}`}>
                  <div className="text-xs text-gray-600">{new Date(m.created_at).toLocaleString()}</div>
                  <div>{m.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <textarea
            placeholder="Type a message..."
            className="flex-1 border rounded p-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="bg-[#1e90ff] text-white px-3 py-2 rounded" onClick={send} disabled={!selected || !body.trim()}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
}