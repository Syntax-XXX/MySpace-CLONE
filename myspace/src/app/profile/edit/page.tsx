"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { uploadUserAvatar } from "../../../lib/storage";

// Types for comprehensive profile customization
interface ProfileSection {
  id: string;
  type: "about" | "interests" | "music" | "photos" | "custom";
  title: string;
  content: string;
  visible: boolean;
  order: number;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
  };
}

interface ProfileTheme {
  layout: "classic" | "modern" | "minimal" | "creative";
  background: {
    type: "solid" | "gradient" | "image" | "pattern";
    value: string;
    overlay?: string;
    opacity?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    background: string;
    surface: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: "small" | "medium" | "large";
  };
  spacing: "compact" | "normal" | "spacious";
  borderRadius: "none" | "small" | "medium" | "large";
  animations: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  visible: boolean;
}

const defaultTheme: ProfileTheme = {
  layout: "modern",
  background: {
    type: "gradient",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  colors: {
    primary: "#6366f1",
    secondary: "#10b981",
    accent: "#f59e0b",
    text: "#1f2937",
    textSecondary: "#6b7280",
    background: "#ffffff",
    surface: "#f9fafb",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    fontSize: "medium",
  },
  spacing: "normal",
  borderRadius: "medium",
  animations: true,
};

const socialPlatforms = [
  { name: "Twitter", icon: "🐦", placeholder: "https://twitter.com/username" },
  { name: "Instagram", icon: "📷", placeholder: "https://instagram.com/username" },
  { name: "LinkedIn", icon: "💼", placeholder: "https://linkedin.com/in/username" },
  { name: "GitHub", icon: "💻", placeholder: "https://github.com/username" },
  { name: "YouTube", icon: "📺", placeholder: "https://youtube.com/c/username" },
  { name: "TikTok", icon: "🎵", placeholder: "https://tiktok.com/@username" },
  { name: "Website", icon: "🌐", placeholder: "https://yourwebsite.com" },
  { name: "Email", icon: "📧", placeholder: "your@email.com" },
];

const backgroundPatterns = [
  { name: "Dots", value: "radial-gradient(circle, #00000020 1px, transparent 1px)", size: "20px 20px" },
  { name: "Grid", value: "linear-gradient(#00000020 1px, transparent 1px), linear-gradient(90deg, #00000020 1px, transparent 1px)", size: "20px 20px" },
  { name: "Diagonal", value: "repeating-linear-gradient(45deg, transparent, transparent 10px, #00000020 10px, #00000020 20px)" },
  { name: "Waves", value: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 20\"><path d=\"M0 10c10-5 20-5 30 0s20 5 30 0 20-5 30 0 20 5 30 0v10H0z\" fill=\"%23ffffff20\"/></svg>')" },
];

export default function ProfileEditor() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [user, setUser] = useState<any>(null);
  
  // Profile Data
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState("/default-avatar.png");
  const [coverImage, setCoverImage] = useState("");
  
  // Theme & Customization
  const [theme, setTheme] = useState<ProfileTheme>(defaultTheme);
  const [sections, setSections] = useState<ProfileSection[]>([
    {
      id: "about",
      type: "about",
      title: "About Me",
      content: "",
      visible: true,
      order: 1,
    },
    {
      id: "interests",
      type: "interests",
      title: "My Interests",
      content: "",
      visible: true,
      order: 2,
    },
    {
      id: "music",
      type: "music",
      title: "Currently Playing",
      content: "",
      visible: false,
      order: 3,
    },
  ]);
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!supabase) throw new Error("Supabase not configured");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUser(user);
        
        // Load user profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          setUsername(profile.username || "");
          setDisplayName(profile.display_name || "");
          setBio(profile.bio || "");
          setLocation(profile.location || "");
          setWebsite(profile.website || "");
          setAvatar(profile.profile_picture || "/default-avatar.png");
          setCoverImage(profile.cover_image || "");
          
          // Parse theme and sections from profile data
          if (profile.theme) {
            try {
              const parsedTheme = JSON.parse(profile.theme);
              setTheme({ ...defaultTheme, ...parsedTheme });
            } catch (e) {
              console.error("Error parsing theme:", e);
            }
          }
          
          if (profile.sections) {
            try {
              const parsedSections = JSON.parse(profile.sections);
              setSections(parsedSections);
            } catch (e) {
              console.error("Error parsing sections:", e);
            }
          }
          
          if (profile.social_links) {
            try {
              const parsedLinks = JSON.parse(profile.social_links);
              setSocialLinks(parsedLinks);
            } catch (e) {
              console.error("Error parsing social links:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [supabase, router]);

  // Save profile
  const saveProfile = async () => {
    if (!user || !supabase) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Handle avatar upload
      let profilePicture = avatar;
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        await uploadUserAvatar(user.id, file);
        profilePicture = `/api/avatars/${user.id}`;
      }
      
      // Save to database
      const { error } = await supabase
        .from("users")
        .update({
          username,
          display_name: displayName,
          bio,
          location,
          website,
          profile_picture: profilePicture,
          cover_image: coverImage,
          theme: JSON.stringify(theme),
          sections: JSON.stringify(sections),
          social_links: JSON.stringify(socialLinks),
          background_style: generateBackgroundCSS(),
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      setAvatar(profilePicture);
      setMessage({ type: "success", text: "Profile saved successfully!" });
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  // Generate CSS for background
  const generateBackgroundCSS = () => {
    const { background } = theme;
    let css = "";
    
    switch (background.type) {
      case "solid":
        css = `background-color: ${background.value};`;
        break;
      case "gradient":
        css = `background: ${background.value};`;
        break;
      case "image":
        css = `background-image: url('${background.value}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
        if (background.overlay) {
          css += ` background-blend-mode: overlay; background-color: ${background.overlay};`;
        }
        break;
      case "pattern":
        const pattern = backgroundPatterns.find(p => p.value === background.value);
        css = `background-image: ${background.value}; background-size: ${pattern?.size || "20px 20px"};`;
        break;
    }
    
    if (background.opacity && background.opacity < 1) {
      css += ` opacity: ${background.opacity};`;
    }
    
    return css;
  };

  // Preview styles
  const previewStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      fontFamily: theme.typography.bodyFont,
      fontSize: theme.typography.fontSize === "small" ? "14px" : theme.typography.fontSize === "large" ? "18px" : "16px",
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    };
    
    // Apply background
    switch (theme.background.type) {
      case "solid":
        styles.backgroundColor = theme.background.value;
        break;
      case "gradient":
        styles.background = theme.background.value;
        break;
      case "image":
        styles.backgroundImage = `url('${theme.background.value}')`;
        styles.backgroundSize = "cover";
        styles.backgroundPosition = "center";
        styles.backgroundRepeat = "no-repeat";
        break;
      case "pattern":
        styles.backgroundImage = theme.background.value;
        const pattern = backgroundPatterns.find(p => p.value === theme.background.value);
        styles.backgroundSize = pattern?.size || "20px 20px";
        break;
    }
    
    return styles;
  }, [theme]);

  // Add new section
  const addSection = () => {
    const newSection: ProfileSection = {
      id: `section-${Date.now()}`,
      type: "custom",
      title: "New Section",
      content: "",
      visible: true,
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
  };

  // Update section
  const updateSection = (id: string, updates: Partial<ProfileSection>) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  // Delete section
  const deleteSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  // Add social link
  const addSocialLink = (platform: string) => {
    const platformData = socialPlatforms.find(p => p.name === platform);
    if (!platformData) return;
    
    const newLink: SocialLink = {
      id: `link-${Date.now()}`,
      platform,
      url: "",
      icon: platformData.icon,
      visible: true,
    };
    setSocialLinks([...socialLinks, newLink]);
  };

  // Update social link
  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    setSocialLinks(socialLinks.map(link => 
      link.id === id ? { ...link, ...updates } : link
    ));
  };

  // Delete social link
  const deleteSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="modern-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Editor</h1>
            <p className="text-gray-600">Customize your profile to make it uniquely yours</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/profile/${user?.id}`)}
              className="btn btn-secondary"
            >
              Preview Profile
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-6`}>
            {message.text}
          </div>
        )}

        <div className="modern-grid">
          {/* Editor Sidebar */}
          <div className="sidebar">
            <div className="card-flat p-6">
              <div className="editor-tabs mb-6">
                {[
                  { id: "basic", label: "Basic Info", icon: "👤" },
                  { id: "theme", label: "Theme", icon: "🎨" },
                  { id: "sections", label: "Sections", icon: "📝" },
                  { id: "social", label: "Social", icon: "🔗" },
                  { id: "advanced", label: "Advanced", icon: "⚙️" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`editor-tab ${activeTab === tab.id ? "active" : ""}`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div>
                    <label className="label">Avatar</label>
                    <div className="flex items-center space-x-4">
                      <img src={avatar} alt="Avatar" className="avatar avatar-xl" />
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setAvatar(url);
                            }
                          }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                        >
                          Change Avatar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input"
                      placeholder="your_username"
                    />
                  </div>

                  <div>
                    <label className="label">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input"
                      placeholder="Your Display Name"
                    />
                  </div>

                  <div>
                    <label className="label">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="textarea"
                      placeholder="Tell the world about yourself..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="label">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="input"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              )}

              {/* Theme Tab */}
              {activeTab === "theme" && (
                <div className="space-y-6">
                  <div>
                    <label className="label">Layout Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["classic", "modern", "minimal", "creative"].map((layout) => (
                        <button
                          key={layout}
                          onClick={() => setTheme({ ...theme, layout: layout as any })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            theme.layout === layout
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-sm font-medium capitalize">{layout}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Background</label>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        {["solid", "gradient", "image", "pattern"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setTheme({
                              ...theme,
                              background: { ...theme.background, type: type as any }
                            })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              theme.background.type === type
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      {theme.background.type === "solid" && (
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={theme.background.value}
                            onChange={(e) => setTheme({
                              ...theme,
                              background: { ...theme.background, value: e.target.value }
                            })}
                            className="color-picker"
                          />
                          <input
                            type="text"
                            value={theme.background.value}
                            onChange={(e) => setTheme({
                              ...theme,
                              background: { ...theme.background, value: e.target.value }
                            })}
                            className="input"
                            placeholder="#ffffff"
                          />
                        </div>
                      )}

                      {theme.background.type === "gradient" && (
                        <div>
                          <textarea
                            value={theme.background.value}
                            onChange={(e) => setTheme({
                              ...theme,
                              background: { ...theme.background, value: e.target.value }
                            })}
                            className="textarea"
                            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            rows={3}
                          />
                          <div className="mt-2 text-xs text-gray-500">
                            Use CSS gradient syntax or try: linear-gradient(45deg, #ff6b6b, #4ecdc4)
                          </div>
                        </div>
                      )}

                      {theme.background.type === "image" && (
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={theme.background.value}
                            onChange={(e) => setTheme({
                              ...theme,
                              background: { ...theme.background, value: e.target.value }
                            })}
                            className="input"
                            placeholder="https://images.unsplash.com/..."
                          />
                          <div>
                            <label className="label text-xs">Overlay Color (optional)</label>
                            <input
                              type="color"
                              value={theme.background.overlay || "#000000"}
                              onChange={(e) => setTheme({
                                ...theme,
                                background: { ...theme.background, overlay: e.target.value }
                              })}
                              className="color-picker"
                            />
                          </div>
                        </div>
                      )}

                      {theme.background.type === "pattern" && (
                        <div className="grid grid-cols-2 gap-2">
                          {backgroundPatterns.map((pattern) => (
                            <button
                              key={pattern.name}
                              onClick={() => setTheme({
                                ...theme,
                                background: { ...theme.background, value: pattern.value }
                              })}
                              className={`p-3 rounded-lg border-2 text-sm ${
                                theme.background.value === pattern.value
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {pattern.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">Color Scheme</label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(theme.colors).map(([key, value]) => (
                        <div key={key}>
                          <label className="label text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => setTheme({
                                ...theme,
                                colors: { ...theme.colors, [key]: e.target.value }
                              })}
                              className="color-picker w-8 h-8"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setTheme({
                                ...theme,
                                colors: { ...theme.colors, [key]: e.target.value }
                              })}
                              className="input text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Typography</label>
                    <div className="space-y-3">
                      <div>
                        <label className="label text-xs">Font Family</label>
                        <select
                          value={theme.typography.bodyFont}
                          onChange={(e) => setTheme({
                            ...theme,
                            typography: { ...theme.typography, bodyFont: e.target.value, headingFont: e.target.value }
                          })}
                          className="input"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Font Size</label>
                        <select
                          value={theme.typography.fontSize}
                          onChange={(e) => setTheme({
                            ...theme,
                            typography: { ...theme.typography, fontSize: e.target.value as any }
                          })}
                          className="input"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === "sections" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Profile Sections</h3>
                    <button onClick={addSection} className="btn btn-primary btn-sm">
                      Add Section
                    </button>
                  </div>

                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            className="input font-medium"
                            placeholder="Section Title"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateSection(section.id, { visible: !section.visible })}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                section.visible
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {section.visible ? "Visible" : "Hidden"}
                            </button>
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          className="textarea"
                          placeholder="Section content..."
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Tab */}
              {activeTab === "social" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Social Links</h3>
                    <div className="relative group">
                      <button className="btn btn-primary btn-sm">
                        Add Link
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-2">
                          {socialPlatforms.map((platform) => (
                            <button
                              key={platform.name}
                              onClick={() => addSocialLink(platform.name)}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                            >
                              <span className="mr-2">{platform.icon}</span>
                              {platform.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {socialLinks.map((link) => (
                      <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{link.icon}</span>
                            <span className="font-medium">{link.platform}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateSocialLink(link.id, { visible: !link.visible })}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                link.visible
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {link.visible ? "Visible" : "Hidden"}
                            </button>
                            <button
                              onClick={() => deleteSocialLink(link.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                          className="input"
                          placeholder={socialPlatforms.find(p => p.name === link.platform)?.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <div>
                    <label className="label">Spacing</label>
                    <select
                      value={theme.spacing}
                      onChange={(e) => setTheme({ ...theme, spacing: e.target.value as any })}
                      className="input"
                    >
                      <option value="compact">Compact</option>
                      <option value="normal">Normal</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Border Radius</label>
                    <select
                      value={theme.borderRadius}
                      onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value as any })}
                      className="input"
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="label">Animations</label>
                      <p className="text-sm text-gray-600">Enable smooth transitions and hover effects</p>
                    </div>
                    <button
                      onClick={() => setTheme({ ...theme, animations: !theme.animations })}
                      className={`toggle ${theme.animations ? "bg-indigo-500" : "bg-gray-300"}`}
                    >
                      <span className={`toggle-thumb ${theme.animations ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div>
                    <label className="label">Custom CSS</label>
                    <textarea
                      className="textarea font-mono text-sm"
                      placeholder="/* Add your custom CSS here */
.profile-container {
  /* Your styles */
}"
                      rows={8}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Advanced users can add custom CSS to further customize their profile
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="main-content">
            <div className="card-flat p-6">
              <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
              <div className="profile-preview border border-gray-200 rounded-lg overflow-hidden" style={previewStyles}>
                {/* Cover Image */}
                {coverImage && (
                  <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />
                )}
                
                {/* Profile Header */}
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <img src={avatar} alt="Avatar" className="avatar avatar-xl" />
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                        {displayName || username || "Your Name"}
                      </h1>
                      {username && displayName && (
                        <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
                          @{username}
                        </p>
                      )}
                      {location && (
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          📍 {location}
                        </p>
                      )}
                      {bio && (
                        <p className="mt-2" style={{ color: theme.colors.text }}>
                          {bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {socialLinks.filter(link => link.visible && link.url).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socialLinks
                        .filter(link => link.visible && link.url)
                        .map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm border"
                            style={{
                              borderColor: theme.colors.primary,
                              color: theme.colors.primary,
                            }}
                          >
                            <span className="mr-1">{link.icon}</span>
                            {link.platform}
                          </a>
                        ))}
                    </div>
                  )}
                </div>

                {/* Profile Sections */}
                <div className="px-6 pb-6 space-y-4">
                  {sections
                    .filter(section => section.visible && section.content)
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.primary,
                          borderWidth: "1px",
                        }}
                      >
                        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
                          {section.title}
                        </h3>
                        <div style={{ color: theme.colors.text }}>
                          {section.content.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}