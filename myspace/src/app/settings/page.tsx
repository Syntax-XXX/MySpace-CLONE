"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";

export default function SettingsPage() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const userResp = await supabase.auth.getUser();
        const user = userResp.data.user;
        if (!user) return;
        const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
        setSettings(data || {});
      } catch (e: any) {
        setErr(e?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || "Save failed");
      alert("Settings saved");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="space-y-3">
        <label className="block">
          Visibility
          <select value={settings.visibility || "public"} onChange={(e) => setSettings({ ...settings, visibility: e.target.value })} className="w-full border p-2 rounded">
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </label>

        <label className="block">
          Allow direct messages
          <input type="checkbox" checked={settings.allow_messages ?? true} onChange={(e) => setSettings({ ...settings, allow_messages: e.target.checked })} />
        </label>

        <label className="block">
          Profile music URL
          <input className="w-full border p-2 rounded" value={settings.profile_music_url || ""} onChange={(e) => setSettings({ ...settings, profile_music_url: e.target.value })} />
        </label>

        <div className="flex gap-2">
          <button className="bg-[#1e90ff] text-white px-3 py-1 rounded" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {err && <span className="text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}