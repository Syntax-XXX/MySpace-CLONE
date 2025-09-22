"use client";
import React, { useRef, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";
import { uploadUserFile } from "../lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","image/gif","audio/mpeg","audio/mp3","audio/wav"];

export default function PostComposer({ onPosted }: { onPosted?: (p:any)=>void }) {
  const supabase = getSupabaseClient();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat:number,lng:number}|null>(null);
  const fileRef = useRef<HTMLInputElement|null>(null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const arr = Array.from(selected);
    const valid: File[] = [];
    const p: any[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) { setErr(`${f.name} is too large`); continue; }
      if (!ALLOWED_TYPES.includes(f.type)) { setErr(`${f.name} unsupported type`); continue; }
      valid.push(f);
      if (f.type.startsWith("image/")) {
        p.push({ type: "image", url: URL.createObjectURL(f), name: f.name });
      } else {
        p.push({ type: "file", name: f.name });
      }
    }
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...p]);
  }

  async function pickLocation() {
    if (!navigator.geolocation) { setErr("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos)=> setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()=> setErr("Location denied"));
  }

  async function uploadFile(userId:string, file: File) {
    // replace direct upload with helper
    return await uploadUserFile(userId, file);
  }

  async function submit() {
    setSending(true);
    setErr(null);
    setInfo(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user || !token) throw new Error("Not signed in");

      const uploaded: any[] = [];
      for (const f of files) {
        uploaded.push(await uploadFile(user.id, f));
      }

      const resp = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text, is_bulletin: false, privacy: "friends", location, media: uploaded }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || "Create failed");
      setText(""); setFiles([]); setPreviews([]); setLocation(null);
      setInfo("Posted successfully");
      if (onPosted) onPosted(j.post);
    } catch (e:any) {
      setErr(e?.message || "Post failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
      {info && <div className="text-green-700 text-sm mb-2">{info}</div>}
      <div className="flex gap-3">
        <textarea className="flex-1 resize-none input min-h-[84px]" placeholder="Share something..." value={text} onChange={e=>setText(e.target.value)} />
        <div className="w-40 flex flex-col gap-2">
          <label className="block">
            <button className="w-full text-sm btn btn-secondary">Add files</button>
            <input ref={fileRef} type="file" multiple accept="image/*,audio/*" className="hidden" onChange={(e)=>handleFiles(e.target.files)} />
          </label>
          <button onClick={() => fileRef.current?.click()} className="w-full text-sm btn btn-primary">Choose</button>
          <button onClick={pickLocation} className="w-full text-sm btn btn-secondary">Add location</button>
          <button onClick={submit} disabled={sending} className="w-full text-sm btn btn-primary">{sending ? "Posting..." : "Post"}</button>
        </div>
      </div>

      {location && <div className="mt-2 text-xs text-gray-600">Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>}

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative border rounded overflow-hidden">
              {p.type === "image" ? <img src={p.url} className="object-cover w-full h-32" alt={p.name} /> : <div className="p-3 text-sm">{p.name}</div>}
              <button className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded" onClick={()=>{ setPreviews(prev=>prev.filter((_,idx)=>idx!==i)); setFiles(prev=>prev.filter((_,idx)=>idx!==i)); }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}