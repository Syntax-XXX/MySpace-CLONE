"use client";
import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";
import PostComposer from "../../components/PostComposer";
import PostCard from "../../components/PostCard";

export default function FeedPage() {
  const supabase = getSupabaseClient();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    let sub: any;
    async function load() {
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user) return;
      // simple feed: own posts + public posts
      const { data } = await supabase
        .from("posts")
        .select("*,media(*)")
        .order("created_at", { ascending: false })
        .limit(30);
      setPosts(data || []);
      sub = supabase
        .channel("public:posts")
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          setPosts((p)=>[payload.new, ...p]);
        })
        .subscribe();
    }
    load();
    return () => { if (sub?.unsubscribe) sub.unsubscribe(); };
  }, [supabase]);

  return (
    <div className="classic-container">
      <div className="classic-grid">
        {/* Sidebar */}
        <aside className="sidebar-left">
          <div className="module">
            <div className="module-title">Shortcuts</div>
            <div className="module-body list-compact">
              <ul>
                <li><a href="/profile" className="myspace-link">My Profile</a></li>
                <li><a href="/messages" className="myspace-link">Messages</a></li>
                <li><a href="/friends" className="myspace-link">Friends</a></li>
                <li><a href="/notifications" className="myspace-link">Notifications</a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main>
          <section className="module">
            <div className="module-title">Share an update</div>
            <div className="module-body">
              <PostComposer onPosted={(post)=>setPosts((s)=>[post, ...s])} />
            </div>
          </section>

          <section className="module" style={{ marginTop: 12 }}>
            <div className="module-title">Recent Posts</div>
            <div className="module-body feed-grid">
              {posts.map((p:any)=> (
                <div key={p.id} className="card">
                  <PostCard post={p} />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}