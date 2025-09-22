"use client";
import React, { useEffect, useState } from "react";

 type Notification = {
   id: string;
   user_id: string;
   created_at: string;
   is_read: boolean;
   type: string;
   payload?: Record<string, unknown> | null;
   actor?: string | null;
 };
import { getSupabaseClient } from "../../lib/supabaseClient";

export default function NotificationsPage(){
  const supabase = getSupabaseClient();
  const [items,setItems] = useState<Notification[]>([]);

  useEffect(()=>{
    async function load(){
      const u = (await supabase.auth.getUser()).data?.user;
      if(!u) return;
      const { data } = await supabase.from("notifications").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(50);
      setItems(data||[]);
    }
    load();
  },[supabase]);

  async function markReadAll(){
    const ids = items.filter(i=>!i.is_read).map(i=>i.id);
    if(ids.length===0) return;
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/notifications/mark-read", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ ids }) });
    if (!res.ok) return;
    setItems(prev => prev.map(i=> i.is_read ? i : ({...i,is_read:true})));
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4"><h2 className="text-xl">Notifications</h2><button onClick={markReadAll} className="bg-[#1e90ff] text-white px-3 py-1 rounded">Mark all read</button></div>
      <div className="space-y-2">
        {items.map(n=> {
          const text = n.payload ? JSON.stringify(n.payload) : "";
          const trimmed = text.length > 200 ? text.slice(0,200) + "…" : text;
          return (
            <div key={n.id} className={`p-3 border rounded ${n.is_read? 'bg-white':'bg-yellow-50'}`}>
              <div className="font-medium inline-block mr-1">{n.type.replaceAll('_',' ')}</div>
              <span className="text-gray-700 text-sm">{trimmed}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}