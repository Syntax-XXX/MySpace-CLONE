"use client";
import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

export default function PostCard({ post }: { post: any }) {
  const supabase = getSupabaseClient();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [author, setAuthor] = useState<any>(null);

  useEffect(()=> {
    async function loadAuthor() {
      const { data } = await supabase.from("profiles").select("id,username,display_name,profile_picture").eq("id", post.author).maybeSingle();
      setAuthor(data);
    }
    loadAuthor();
  }, [post.author, supabase]);

  async function like() {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user) throw new Error("Not signed in");
      await supabase.from("likes").insert([{ post_id: post.id, user_id: user.id }]);
      setLiked(true);
      setLikesCount(c => c+1);
    } catch { /* ignore duplicates */ }
  }

  return (
    <article className="bg-white border rounded p-4">
      <header className="flex items-center gap-3">
        <img src={author?.profile_picture ? `/storage/${author.profile_picture}` : `/api/avatars/${author?.id||'anon'}`} alt="avatar" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{author?.display_name || author?.username || 'Unknown'}</div>
              <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
            </div>
            {post.location_lat && <div className="text-xs text-gray-500 ml-3">📍 {post.location_lat.toFixed(2)},{post.location_lng.toFixed(2)}</div>}
          </div>
        </div>
      </header>

      <div className="mt-3 text-sm whitespace-pre-wrap">{post.content}</div>

      {post.media && post.media.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {post.media.map((m:any)=> (
            <div key={m.id} className="overflow-hidden rounded bg-gray-50">
              {m.mime_type?.startsWith("image") ? <img src={m.url} alt="" className="w-full h-40 object-cover" /> : <audio controls src={m.url} className="w-full" />}
            </div>
          ))}
        </div>
      )}

      <footer className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={like} className="text-sm text-gray-700">{liked ? 'Liked' : 'Like'}</button>
          <button className="text-sm text-gray-700">Comment</button>
        </div>
        <div className="text-sm text-gray-600">{likesCount} likes</div>
      </footer>
    </article>
  );
}