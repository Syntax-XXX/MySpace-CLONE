"use client";
import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

export default function FriendRequestsPage() {
  const supabase = getSupabaseClient();
  const [incoming,setIncoming] = useState<any[]>([]);
  const [outgoing,setOutgoing] = useState<any[]>([]);

  useEffect(()=>{
    async function load(){
      const u = (await supabase.auth.getUser()).data?.user;
      if(!u) return;
      const { data: inData } = await supabase.from("friend_requests").select("*,requester:requester(*)").eq("recipient", u.id).eq("status","pending");
      const { data: outData } = await supabase.from("friend_requests").select("*,recipient:recipient(*)").eq("requester", u.id).eq("status","pending");
      setIncoming(inData||[]);
      setOutgoing(outData||[]);
    }
    load();
  },[supabase]);

  async function respond(id:string, action:string){
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/friends/respond", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ requestId: id, action }) });
    if (!res.ok) return;
    // reload
    const u = (await supabase.auth.getUser()).data?.user;
    if (!u) return;
    const { data: inData } = await supabase.from("friend_requests").select("*,requester:requester(*)").eq("recipient", u.id).eq("status","pending");
    const { data: outData } = await supabase.from("friend_requests").select("*,recipient:recipient(*)").eq("requester", u.id).eq("status","pending");
    setIncoming(inData||[]); setOutgoing(outData||[]);
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-xl mb-3">Friend Requests</h2>
      <section>
        <h3 className="font-semibold">Incoming</h3>
        {incoming.map(r=> (
          <div key={r.id} className="p-3 border rounded mb-2 flex justify-between">
            <div>{r.requester?.username || r.requester}</div>
            <div className="flex gap-2">
              <button onClick={()=>respond(r.id,'accept')} className="bg-green-500 text-white px-2 rounded">Accept</button>
              <button onClick={()=>respond(r.id,'reject')} className="bg-gray-200 px-2 rounded">Reject</button>
            </div>
          </div>
        ))}
      </section>
      <section className="mt-4">
        <h3 className="font-semibold">Outgoing</h3>
        {outgoing.map(r=>(
          <div key={r.id} className="p-3 border rounded mb-2">{r.recipient?.username || r.recipient}</div>
        ))}
      </section>
    </div>
  );
}