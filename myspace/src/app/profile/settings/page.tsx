"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { uploadUserFile } from "../../../lib/storage";

interface UserProfile {
  id: string;
  username: string | null;
  email?: string | null;
  bio?: string | null;
  profile_picture?: string | null;
  background_style?: string | null;
}

export default function ProfileSettings() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canSave = useMemo(() => !!profile && !saving, [profile, saving]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!supabase) throw new Error("Supabase not configured");
        const u = (await supabase.auth.getUser()).data?.user;
        if (!u) throw new Error("Not signed in");
        const { data, error: err } = await supabase
          .from("users")
          .select("id, username, bio, profile_picture, background_style")
          .eq("id", u.id)
          .maybeSingle();
        if (err) throw err;
        const fallback: UserProfile = { id: u.id, username: u.email?.split("@")[0] || null } as any;
        const p = (data as UserProfile) || fallback;
        if (!mounted) return;
        setProfile(p);
        setPreviewUrl(p.profile_picture || null);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  async function onSave() {
    if (!profile || !supabase) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const u = (await supabase.auth.getUser()).data?.user;
      if (!u) throw new Error("Not signed in");

      let newUrl: string | null = previewUrl || null;
      if (file) {
        const uploaded = await uploadUserFile(u.id, file);
        newUrl = uploaded.url || null;
      }

      const payload = {
        id: u.id,
        username: profile.username,
        bio: profile.bio ?? null,
        profile_picture: newUrl,
        background_style: profile.background_style ?? null,
      };
      const { error: upErr } = await supabase.from("users").upsert(payload, { onConflict: "id" });
      if (upErr) throw upErr;
      setMessage("Profile saved successfully");
      setFile(null);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading profile…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!profile) return <div className="p-6">No profile loaded.</div>;

  return (
    <div className="classic-container">
      <div className="classic-grid">
        {/* Left sidebar */}
        <aside className="sidebar-left">
          <div className="module">
            <div className="module-title">Profile Picture</div>
            <div className="module-body">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl || "/default-avatar.png"}
                  alt="avatar preview"
                  className="avatar avatar-lg"
                />
                <div className="text-sm">
                  <div className="mb-2">JPG/PNG/WEBP up to 10MB</div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      setMessage(null);
                      if (f) setPreviewUrl(URL.createObjectURL(f));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="module" style={{ marginTop: 12 }}>
            <div className="module-title">Theme & Background</div>
            <div className="module-body">
              <label className="block text-sm mb-1">Background CSS class</label>
              <input
                className="input w-full"
                placeholder="e.g., bg-[url('/wallpaper.jpg')] bg-cover"
                value={profile.background_style || ""}
                onChange={(e) => setProfile({ ...profile, background_style: e.target.value })}
              />
              <p className="text-xs text-gray-600 mt-2">
                Tip: paste a Tailwind class or inline style to customize your profile background.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main>
          <section className="module">
            <div className="module-title">Profile Settings</div>
            <div className="module-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Username</label>
                  <input
                    className="input w-full"
                    placeholder="Username"
                    value={profile.username || ""}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Display name</label>
                  <input
                    className="input w-full"
                    placeholder="Optional display name"
                    value={profile.email?.split("@")[0] || ""}
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Bio</label>
                <textarea
                  className="input w-full min-h-[100px]"
                  placeholder="Tell us about yourself"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <button className="btn btn-primary" onClick={onSave} disabled={!canSave}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setFile(null);
                    setMessage(null);
                    setError(null);
                  }}
                >
                  Reset
                </button>
                {message && <span className="text-green-700 text-sm">{message}</span>}
                {error && <span className="text-red-600 text-sm">{error}</span>}
              </div>
            </div>
          </section>

          <section className="module" style={{ marginTop: 12 }}>
            <div className="module-title">Classic Sections</div>
            <div className="module-body text-sm text-gray-700">
              Use the classic layout to add sections like About Me, Interests, and Top Friends on your public profile page.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
