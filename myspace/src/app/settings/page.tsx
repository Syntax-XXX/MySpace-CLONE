"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { uploadUserAvatar } from "../../lib/storage";

// Types
interface ThemeState {
  background: {
    type: "solid" | "gradient" | "image";
    solidColor: string;
    gradient: { from: string; via: string; to: string; direction: "r" | "br" | "b" | "bl" };
    image: { url: string; size: "cover" | "contain" | "auto"; position: "center" | "top" | "bottom" | "left" | "right"; repeat: "no-repeat" | "repeat" | "repeat-x" | "repeat-y" };
  };
  colors: { primary: string; secondary: string; accent: string };
  typography: { fontFamily: string; fontSize: number };
  links?: string[];
  privacy?: { twoFactor?: boolean };
  notifications?: { email?: boolean; sms?: boolean; push?: boolean; digest?: string; quietStart?: string; quietEnd?: string };
}

const defaultTheme: ThemeState = {
  background: {
    type: "solid",
    solidColor: "#111827",
    gradient: { from: "#0ea5e9", via: "#6366f1", to: "#a855f7", direction: "r" },
    image: { url: "", size: "cover", position: "center", repeat: "no-repeat" },
  },
  colors: { primary: "#1e90ff", secondary: "#10b981", accent: "#f59e0b" },
  typography: { fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, Apple Color Emoji, Segoe UI Emoji", fontSize: 16 },
  links: [],
  privacy: { twoFactor: false },
  notifications: { email: true, sms: false, push: false, digest: "Off", quietStart: "22:00", quietEnd: "08:00" },
};

export default function SettingsPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<string>("appearance");

  // Profile
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("/default-avatar.png");
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  // Settings and theme
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<string>("public");
  const [allowMessages, setAllowMessages] = useState<boolean>(true);
  const [profileMusicUrl, setProfileMusicUrl] = useState<string>("");

  const [links, setLinks] = useState<string[]>([]);

  const [theme, setTheme] = useState<ThemeState>(defaultTheme);

  // Load initial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (!supabase) throw new Error("Supabase not configured");
        const u = (await supabase.auth.getUser()).data?.user;
        if (!u) throw new Error("Not signed in");
        setUserId(u.id);
        setEmail(u.email || "");

        // Load users
        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("username, bio, profile_picture, background_style")
          .eq("id", u.id)
          .maybeSingle();
        if (userErr) throw userErr;
        if (userRow) {
          setUsername(userRow.username || "");
          setBio(userRow.bio || "");
          setAvatar(userRow.profile_picture || "/default-avatar.png");
        }

        // Load settings
        const { data: settingsRow } = await supabase
          .from("user_settings")
          .select("visibility, allow_messages, profile_music_url, theme")
          .eq("user_id", u.id)
          .maybeSingle();
        setVisibility(settingsRow?.visibility || "public");
        setAllowMessages(settingsRow?.allow_messages ?? true);
        setProfileMusicUrl(settingsRow?.profile_music_url || "");
        const parsedTheme: ThemeState = settingsRow?.theme ? JSON.parse(settingsRow.theme) : defaultTheme;
        // Merge with defaults
        const merged: ThemeState = {
          ...defaultTheme,
          ...parsedTheme,
          background: { ...defaultTheme.background, ...(parsedTheme?.background || {}) },
          colors: { ...defaultTheme.colors, ...(parsedTheme?.colors || {}) },
          typography: { ...defaultTheme.typography, ...(parsedTheme?.typography || {}) },
          notifications: { ...defaultTheme.notifications, ...(parsedTheme?.notifications || {}) },
          privacy: { ...defaultTheme.privacy, ...(parsedTheme?.privacy || {}) },
          links: parsedTheme?.links || [],
        };
        setTheme(merged);
        setLinks(merged.links || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  // Builder helpers
  function getBgType() {
    return theme.background.type;
  }

  function cssEscapeUrl(u: string) {
    if (!u) return "";
    return u.replace(/["')("]/g, (s) => "\\" + s);
  }

  const previewStyle: React.CSSProperties = useMemo(() => {
    const st: React.CSSProperties = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      // demo button colors via CSS variables
      ["--primary" as any]: theme.colors.primary,
      ["--secondary" as any]: theme.colors.secondary,
      ["--accent" as any]: theme.colors.accent,
    };
    if (theme.background.type === "solid") {
      st.backgroundColor = theme.background.solidColor;
    } else if (theme.background.type === "gradient") {
      const dirMap: any = { r: "to right", br: "to bottom right", b: "to bottom", bl: "to bottom left" };
      st.backgroundImage = `linear-gradient(${dirMap[theme.background.gradient.direction]}, ${theme.background.gradient.from}, ${theme.background.gradient.via}, ${theme.background.gradient.to})`;
    } else if (theme.background.type === "image") {
      const i = theme.background.image;
      st.backgroundImage = i.url ? `url('${cssEscapeUrl(i.url)}')` : undefined;
      st.backgroundSize = i.size;
      st.backgroundPosition = i.position;
      st.backgroundRepeat = i.repeat;
    }
    return st;
  }, [theme]);

  function buildTailwindClasses(): string {
    const classes: string[] = [];
    if (theme.background.type === "solid") {
      classes.push(`bg-[${theme.background.solidColor}]`);
    } else if (theme.background.type === "gradient") {
      classes.push(`bg-gradient-to-${theme.background.gradient.direction}`);
      classes.push(`from-[${theme.background.gradient.from}]`);
      classes.push(`via-[${theme.background.gradient.via}]`);
      classes.push(`to-[${theme.background.gradient.to}]`);
    } else if (theme.background.type === "image") {
      const i = theme.background.image;
      if (i.url) classes.push(`bg-[url('${i.url.replace(/'/g, "\\'")}')]`);
      classes.push(`bg-${i.size}`);
      classes.push(`bg-${i.position}`);
      classes.push(`bg-${i.repeat}`);
    }
    classes.push(`text-[${theme.typography.fontSize}px]`);
    classes.push(`font-[${theme.typography.fontFamily}]`);
    return classes.join(" ");
  }

  function buildInlineStyleString(): string {
    const parts: string[] = [
      `--primary:${theme.colors.primary}`,
      `--secondary:${theme.colors.secondary}`,
      `--accent:${theme.colors.accent}`,
      `font-family:${theme.typography.fontFamily}`,
      `font-size:${theme.typography.fontSize}px`,
    ];
    if (theme.background.type === "solid") {
      parts.push(`background-color:${theme.background.solidColor}`);
    } else if (theme.background.type === "gradient") {
      const dirMap: any = { r: "to right", br: "to bottom right", b: "to bottom", bl: "to bottom left" };
      parts.push(`background-image:linear-gradient(${dirMap[theme.background.gradient.direction]}, ${theme.background.gradient.from}, ${theme.background.gradient.via}, ${theme.background.gradient.to})`);
    } else if (theme.background.type === "image") {
      const i = theme.background.image;
      if (i.url) parts.push(`background-image:url('${cssEscapeUrl(i.url)}')`);
      parts.push(`background-size:${i.size}`);
      parts.push(`background-position:${i.position}`);
      parts.push(`background-repeat:${i.repeat}`);
    }
    return parts.join("; ") + ";";
  }

  // Actions
  async function saveProfile() {
    if (!supabase || !userId) return;
    setSaving(true);
    setErr(null);
    setMessage(null);
    try {
      let profile_picture = avatar;
      const file = avatarFileRef.current?.files?.[0];
      if (file) {
        await uploadUserAvatar(userId, file);
        profile_picture = `/api/avatars/${userId}`;
      }
      const { error } = await supabase.from("users").update({ username, bio, profile_picture }).eq("id", userId);
      if (error) throw error;
      setAvatar(profile_picture);
      setMessage("Profile updated");
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    if (!supabase || !userId) return;
    setSaving(true);
    setErr(null);
    setMessage(null);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ visibility, allow_messages: allowMessages, profile_music_url: profileMusicUrl, theme }),
      });
      if (!resp.ok) throw new Error((await resp.json())?.error || "Save failed");
      setMessage("Settings saved");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function applyBackgroundToProfile() {
    if (!supabase || !userId) return;
    setSaving(true);
    setErr(null);
    setMessage(null);
    try {
      const css = buildInlineStyleString();
      const { error } = await supabase.from("users").update({ background_style: css }).eq("id", userId);
      if (error) throw error;
      setMessage("Background applied to profile");
    } catch (e: any) {
      setErr(e?.message || "Apply failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!email) throw new Error("No email on account");
      const redirectTo = `${window.location.origin}/auth/verify-callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage("Password reset email sent");
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    }
  }

  async function exportData() {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch("/api/account/export", { headers: { Authorization: `Bearer ${token}` } });
      const blob = new Blob([JSON.stringify(await resp.json(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `myspace-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Export failed");
    }
  }

  async function deleteAccount() {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!confirm("This will permanently delete your account and data. Continue?")) return;
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch("/api/account/delete", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error((await resp.json())?.error || "Delete failed");
      await supabase.auth.signOut();
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  // UI helpers
  function TabButton({ id, label }: { id: string; label: string }) {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full text-left px-3 py-2 rounded-lg transition ${active ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"}`}
      >
        {label}
      </button>
    );
  }

  if (loading) return <div className="p-6">Loading settings…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-gray-500">Modern, responsive settings with live theming builder.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Sidebar */}
        <nav className="md:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow p-2 sticky top-4">
            <div className="hidden md:block">
              <ul className="space-y-1">
                <li><TabButton id="profile" label="Profile Info" /></li>
                <li><TabButton id="privacy" label="Privacy & Security" /></li>
                <li><TabButton id="appearance" label="Themes & Appearance" /></li>
                <li><TabButton id="notifications" label="Notifications" /></li>
                <li><TabButton id="advanced" label="Advanced" /></li>
              </ul>
            </div>
            <div className="md:hidden flex gap-2 overflow-x-auto">
              {[
                ["profile", "Profile"],
                ["privacy", "Privacy"],
                ["appearance", "Appearance"],
                ["notifications", "Notifications"],
                ["advanced", "Advanced"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`whitespace-nowrap inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
                >{label}</button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="md:col-span-9 space-y-4">
          {/* Profile Info */}
          {activeTab === "profile" && (
            <section className="bg-white rounded-xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Profile Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full border object-cover bg-gray-100" />
                      <button onClick={() => avatarFileRef.current?.click()} className="absolute -bottom-2 -right-2 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Change</button>
                      <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]; if (f) { const url = URL.createObjectURL(f); setAvatar(url); }
                      }} />
                    </div>
                    <p className="text-xs text-gray-500">Upload will be saved on Save Profile.</p>
                  </div>
                </div>
                <div className="sm:col-span-2 grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Username</div>
                    <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Bio</div>
                    <textarea className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px]" value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Links</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {links.map((link, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={link} onChange={(e) => {
                            const next = [...links]; next[idx] = e.target.value; setLinks(next); setTheme({ ...theme, links: next });
                          }} />
                          <button className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => {
                            const next = links.filter((_, i) => i !== idx); setLinks(next); setTheme({ ...theme, links: next });
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 mt-2" onClick={() => { const next = [...links, ""]; setLinks(next); setTheme({ ...theme, links: next }); }}>Add another</button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveProfile} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
                <button onClick={() => router.refresh()} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              </div>
            </section>
          )}

          {/* Privacy & Security */}
          {activeTab === "privacy" && (
            <section className="bg-white rounded-xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Privacy & Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Password</div>
                    <button onClick={sendPasswordReset} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 mt-2">Send reset email</button>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Profile Visibility</div>
                    <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                      <option value="public">Public</option>
                      <option value="friends">Friends only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Two-Factor Authentication (2FA)</div>
                      <p className="text-xs text-gray-500">Store preference; activation flow not implemented in this demo.</p>
                    </div>
                    <button
                      className={`h-5 w-10 rounded-full transition-colors ${theme.privacy?.twoFactor ? "bg-blue-500" : "bg-gray-200"}`}
                      onClick={() => setTheme({ ...theme, privacy: { ...theme.privacy, twoFactor: !theme.privacy?.twoFactor } })}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition ${theme.privacy?.twoFactor ? "translate-x-5" : "translate-x-0"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="allowMessages" type="checkbox" checked={allowMessages} onChange={(e) => setAllowMessages(e.target.checked)} />
                    <label htmlFor="allowMessages" className="text-sm">Allow direct messages</label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveSettings} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </section>
          )}

          {/* Themes & Appearance */}
          {activeTab === "appearance" && (
            <section className="bg-white rounded-xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Themes & Appearance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-5">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Background Type</div>
                    <div className="flex flex-wrap gap-2">
                      {(["solid", "gradient", "image"] as const).map((t) => (
                        <label key={t} className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="bgType" value={t} checked={getBgType() === t} onChange={() => setTheme({ ...theme, background: { ...theme.background, type: t } })} />
                          <span className="text-sm capitalize">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Solid */}
                  {getBgType() === "solid" && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Solid color</div>
                      <div className="flex items-center gap-3">
                        <input type="color" className="h-10 w-16 rounded-lg border" value={theme.background.solidColor} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, solidColor: e.target.value } })} />
                        <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.background.solidColor} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, solidColor: e.target.value } })} />
                      </div>
                    </div>
                  )}

                  {/* Gradient */}
                  {getBgType() === "gradient" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">From</div>
                          <input type="color" className="h-10 w-16 rounded-lg border" value={theme.background.gradient.from} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, gradient: { ...theme.background.gradient, from: e.target.value } } })} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Via</div>
                          <input type="color" className="h-10 w-16 rounded-lg border" value={theme.background.gradient.via} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, gradient: { ...theme.background.gradient, via: e.target.value } } })} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">To</div>
                          <input type="color" className="h-10 w-16 rounded-lg border" value={theme.background.gradient.to} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, gradient: { ...theme.background.gradient, to: e.target.value } } })} />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Direction</div>
                        <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.background.gradient.direction} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, gradient: { ...theme.background.gradient, direction: e.target.value as any } } })}>
                          <option value="r">Left → Right</option>
                          <option value="br">Top-left → Bottom-right</option>
                          <option value="b">Top → Bottom</option>
                          <option value="bl">Top-right → Bottom-left</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {getBgType() === "image" && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Image URL</div>
                      <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://images.unsplash.com/photo-..." value={theme.background.image.url} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, image: { ...theme.background.image, url: e.target.value } } })} />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Size</div>
                          <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.background.image.size} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, image: { ...theme.background.image, size: e.target.value as any } } })}>
                            <option value="cover">cover</option>
                            <option value="contain">contain</option>
                            <option value="auto">auto</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Position</div>
                          <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.background.image.position} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, image: { ...theme.background.image, position: e.target.value as any } } })}>
                            <option value="center">center</option>
                            <option value="top">top</option>
                            <option value="bottom">bottom</option>
                            <option value="left">left</option>
                            <option value="right">right</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Repeat</div>
                          <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.background.image.repeat} onChange={(e) => setTheme({ ...theme, background: { ...theme.background, image: { ...theme.background.image, repeat: e.target.value as any } } })}>
                            <option value="no-repeat">no-repeat</option>
                            <option value="repeat">repeat</option>
                            <option value="repeat-x">repeat-x</option>
                            <option value="repeat-y">repeat-y</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Upload flow is omitted here; you can paste any image URL.</p>
                    </div>
                  )}

                  <hr className="border-gray-200" />

                  {/* Brand colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Primary</div>
                      <input type="color" className="h-10 w-16 rounded-lg border" value={theme.colors.primary} onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, primary: e.target.value } })} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Secondary</div>
                      <input type="color" className="h-10 w-16 rounded-lg border" value={theme.colors.secondary} onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, secondary: e.target.value } })} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Accent</div>
                      <input type="color" className="h-10 w-16 rounded-lg border" value={theme.colors.accent} onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, accent: e.target.value } })} />
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Font family</div>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.typography.fontFamily} onChange={(e) => setTheme({ ...theme, typography: { ...theme.typography, fontFamily: e.target.value } })}>
                        <option value="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, Apple Color Emoji, Segoe UI Emoji">Sans (system)</option>
                        <option value="ui-serif, Georgia, Cambria, Times New Roman, Times, serif">Serif</option>
                        <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Base font size</div>
                      <input type="range" min={14} max={20} value={theme.typography.fontSize} onChange={(e) => setTheme({ ...theme, typography: { ...theme.typography, fontSize: Number(e.target.value) } })} className="w-full" />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={saveSettings} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600" disabled={saving}>{saving ? "Saving…" : "Save Theme"}</button>
                    <button onClick={applyBackgroundToProfile} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Apply to Profile Background</button>
                  </div>
                </div>

                {/* Live Preview + Export */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Live Preview</div>
                  <div className="rounded-xl border border-gray-200 h-64 p-5 flex flex-col" style={previewStyle}>
                    <div className="mt-auto">
                      <div className="text-sm text-white/80">Profile preview</div>
                      <h3 className="text-2xl font-semibold text-white">Your Display Name</h3>
                      <p className="text-white/90">This is how your profile card could look with your chosen theme.</p>
                      <div className="mt-3 flex gap-2">
                        <a href="#" className="px-3 py-1 rounded-lg text-sm text-white border border-white/40 hover:bg-white/10 transition">Link</a>
                        <button className="px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: theme.colors.primary }}>Primary</button>
                        <button className="px-3 py-1.5 rounded-lg text-sm text-gray-900" style={{ background: theme.colors.accent }}>Accent</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Export Tailwind classes</div>
                      <div className="flex gap-2">
                        <textarea readOnly className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-200 h-24" value={buildTailwindClasses()} />
                        <button onClick={() => copy(buildTailwindClasses())} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 h-24">Copy</button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Note: dynamic Tailwind classes may be purged at build time; prefer inline styles for reliable backgrounds.</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Export inline styles</div>
                      <div className="flex gap-2">
                        <textarea readOnly className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-200 h-24" value={buildInlineStyleString()} />
                        <button onClick={() => copy(buildInlineStyleString())} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 h-24">Copy</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <section className="bg-white rounded-xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Email notifications</div>
                      <p className="text-xs text-gray-500">Mentions, replies, and security alerts</p>
                    </div>
                    <button
                      className={`h-5 w-10 rounded-full transition-colors ${theme.notifications?.email ? "bg-blue-500" : "bg-gray-200"}`}
                      onClick={() => setTheme({ ...theme, notifications: { ...theme.notifications, email: !theme.notifications?.email } })}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition ${theme.notifications?.email ? "translate-x-5" : "translate-x-0"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">SMS notifications</div>
                      <p className="text-xs text-gray-500">Only critical updates</p>
                    </div>
                    <button
                      className={`h-5 w-10 rounded-full transition-colors ${theme.notifications?.sms ? "bg-blue-500" : "bg-gray-200"}`}
                      onClick={() => setTheme({ ...theme, notifications: { ...theme.notifications, sms: !theme.notifications?.sms } })}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition ${theme.notifications?.sms ? "translate-x-5" : "translate-x-0"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Push notifications</div>
                      <p className="text-xs text-gray-500">All activity on your posts</p>
                    </div>
                    <button
                      className={`h-5 w-10 rounded-full transition-colors ${theme.notifications?.push ? "bg-blue-500" : "bg-gray-200"}`}
                      onClick={() => setTheme({ ...theme, notifications: { ...theme.notifications, push: !theme.notifications?.push } })}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition ${theme.notifications?.push ? "translate-x-5" : "translate-x-0"}`}></span>
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Digest frequency</div>
                    <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.notifications?.digest} onChange={(e) => setTheme({ ...theme, notifications: { ...theme.notifications, digest: e.target.value } })}>
                      <option>Off</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Quiet hours</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.notifications?.quietStart || ""} onChange={(e) => setTheme({ ...theme, notifications: { ...theme.notifications, quietStart: e.target.value } })} />
                      <input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" value={theme.notifications?.quietEnd || ""} onChange={(e) => setTheme({ ...theme, notifications: { ...theme.notifications, quietEnd: e.target.value } })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveSettings} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600" disabled={saving}>{saving ? "Saving…" : "Save Notification Settings"}</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Advanced */}
          {activeTab === "advanced" && (
            <section className="bg-white rounded-xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Advanced</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Export data</div>
                    <p className="text-xs text-gray-500">Download a copy of your data</p>
                  </div>
                  <button onClick={exportData} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Export</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Delete account</div>
                    <p className="text-xs text-gray-500">This action cannot be undone</p>
                  </div>
                  <button onClick={deleteAccount} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600">Delete</button>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">API keys (demo)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs flex items-center justify-between"><span className="font-mono truncate">pk_live_************************</span><button className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 ml-2" onClick={() => copy("pk_live_************************")}>Copy</button></div>
                    <div className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs flex items-center justify-between"><span className="font-mono truncate">sk_live_************************</span><button className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 ml-2" onClick={() => copy("sk_live_************************")}>Copy</button></div>
                  </div>
                  <button className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 mt-2" onClick={() => alert("New key generated (demo)")}>Generate new key</button>
                </div>
              </div>
            </section>
          )}

          {(message || err) && (
            <div className="text-sm">
              {message && <span className="text-green-700">{message}</span>}
              {err && <span className="text-red-600 ml-3">{err}</span>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
