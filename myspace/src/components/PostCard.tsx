"use client";
import React, { useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

export default function PostCard({ post }: { post: any }) {
  const supabase = getSupabaseClient();
  const [liked, setLiked] = useState(false);

  async function like() {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user) throw new Error("Not signed in");
      await supabase.from("likes").insert([{ post_id: post.id, user_id: user.id }]);
      setLiked(true);
    } catch { /* ignore duplicate */ }
  }

  return (
    <div className="p-4 border rounded">
      <div className="text-sm text-gray-600">{post.author}</div>
      <div className="mt-2">{post.content}</div>
      {post.media && post.media.length > 0 && (
        <div className="mt-2 grid gap-2">
          {post.media.map((m:any)=> (
            <img key={m.id} src={m.url||''} alt="" className="max-h-48 rounded" />
          ))}
        </div>
      )}
      {post.location_lat && <div className="text-xs text-gray-500 mt-1">Location: {post.location_lat},{post.location_lng}</div>}
      <div className="mt-3 flex gap-3">
        <button onClick={like} className="text-sm">{liked ? "Liked" : "Like"}</button>
        <button className="text-sm">Comment</button>
      </div>
    </div>
  );
}