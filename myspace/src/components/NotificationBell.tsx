"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";
import Link from "next/link";

type Notification = {
  id: string;
  user_id: string;
  created_at: string;
  is_read: boolean;
  type: string;
  payload?: Record<string, unknown> | null;
  actor?: string | null;
};

const INITIAL_FETCH_LIMIT = 10;
const MAX_ITEMS = 50;

export default function NotificationBell() {
  const supabase = getSupabaseClient();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(() => items.filter(i => !i.is_read).length, [items]);
  const ref = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    if (!supabase) return;
    let sub: any;
    async function load() {
      const user = (await supabase.auth.getUser()).data?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(INITIAL_FETCH_LIMIT);
      if (error) {
        console.error("Failed to load notifications:", error);
        return;
      }
      setItems((data as Notification[]) || []);

      sub = supabase
        .channel(`public:notifications_user_${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setItems((s) => [payload.new as Notification, ...s].slice(0, MAX_ITEMS));
          }
        )
        .subscribe();
    }
    load();

    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (sub?.unsubscribe) sub.unsubscribe();
    };
  }, [supabase]);

  async function markRead(id?: string) {
    if (!supabase) return;
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) {
      console.warn("No auth token; cannot mark notifications as read.");
      return;
    }
    const ids = id ? [id] : items.filter(i=>!i.is_read).map(i=>i.id);
    if (ids.length===0) return;
    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) {
      console.error("Failed to mark notifications read:", await res.text());
      return;
    }
    setItems(prev => prev.map(i=> ids.includes(i.id) ? { ...i, is_read:true } : i));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={()=>setOpen(!open)}
        className="p-2 rounded hover:bg-gray-100 relative"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notifications-popover"
      >
        <span className="sr-only">Notifications</span>🔔
        {unreadCount>0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2">{unreadCount}</span>}
      </button>

      {open && (
        <div id="notifications-popover" role="dialog" aria-label="Notifications" className="absolute right-0 mt-2 w-80 max-w-xs bg-white border rounded shadow-lg z-50">
          <div className="flex items-center justify-between p-2 border-b">
            <div className="font-medium">Notifications</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>markRead()} className="text-sm text-blue-600">Mark all read</button>
              <Link href="/notifications" className="text-sm px-2">Open</Link>
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            {items.length===0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
            {items.map(n => (
              <div key={n.id} className={`p-3 border-b hover:bg-gray-50 flex gap-2 ${n.is_read ? 'bg-white' : 'bg-yellow-50'}`}>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{n.type.replaceAll('_',' ')}</div>
                  <div className="text-xs text-gray-600">{n.payload && (JSON.stringify(n.payload).length > 200 ? JSON.stringify(n.payload).slice(0,200) + "…" : JSON.stringify(n.payload))}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                  {!n.is_read && <button onClick={()=>markRead(n.id)} className="text-xs text-blue-600">Mark</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}