"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { uploadUserFile, uploadUserAvatar } from '../lib/storage';
import { convertSpotifyUrlToEmbed, isSpotifyUrl } from '../utils/helpers';

interface ProfileSection {
  id: string;
  section_type: string;
  title: string;
  content: string;
  section_order: number;
  visible: boolean;
  style_config: any;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_text: string;
  icon: string;
  visible: boolean;
  link_order: number;
}

interface UserSettings {
  visibility: 'public' | 'friends' | 'private';
  allow_messages: boolean;
  profile_music_url: string;
  theme: any;
}

interface ExtendedProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  bio: string;
  profile_picture: string;
  cover_image: string;
  location: string;
  website: string;
  theme: any;
  sections: ProfileSection[];
  social_links: SocialLink[];
  settings: UserSettings;
}

const THEME_PRESETS = [
  {
    name: 'Classic Blue',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b'
    }
  },
  {
    name: 'Sunset',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: '#fef3c7',
      surface: '#ffffff',
      text: '#92400e'
    }
  },
  {
    name: 'Forest',
    colors: {
      primary: '#166534',
      secondary: '#22c55e',
      accent: '#84cc16',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#14532d'
    }
  },
  {
    name: 'Purple Dream',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#c084fc',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#581c87'
    }
  },
  {
    name: 'Dark Mode',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9'
    }
  }
];

const SOCIAL_PLATFORMS = [
  { name: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/username' },
  { name: 'Twitter', icon: '🐦', placeholder: 'https://twitter.com/username' },
  { name: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
  { name: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/channel/...' },
  { name: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/username' },
  { name: 'GitHub', icon: '💻', placeholder: 'https://github.com/username' },
  { name: 'Discord', icon: '🎮', placeholder: 'username#1234' },
  { name: 'Snapchat', icon: '👻', placeholder: 'username' },
  { name: 'Twitch', icon: '🎮', placeholder: 'https://twitch.tv/username' },
  { name: 'Spotify', icon: '🎧', placeholder: 'https://open.spotify.com/user/...' }
];

const SECTION_TYPES = [
  { type: 'about', title: 'About Me', icon: '👤' },
  { type: 'interests', title: 'Interests', icon: '❤️' },
  { type: 'music', title: 'Music', icon: '🎵' },
  { type: 'photos', title: 'Photos', icon: '📸' },
  { type: 'blog', title: 'Blog Posts', icon: '📝' },
  { type: 'quotes', title: 'Favorite Quotes', icon: '💭' },
  { type: 'books', title: 'Books', icon: '📚' },
  { type: 'movies', title: 'Movies', icon: '🎬' },
  { type: 'games', title: 'Games', icon: '🎮' },
  { type: 'custom', title: 'Custom Section', icon: '✨' }
];

export default function ProfileEditor() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Theme customization
  const [customTheme, setCustomTheme] = useState(THEME_PRESETS[0]);
  const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'image'>('color');
  const [backgroundImage, setBackgroundImage] = useState('');

  const loadProfile = useCallback(async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Load profile sections
      const { data: sectionsData } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('user_id', user.id)
        .order('section_order');

      // Load social links
      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', user.id)
        .order('link_order');

      // Load user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const extendedProfile: ExtendedProfile = {
        ...userData,
        sections: sectionsData || [],
        social_links: socialData || [],
        settings: settingsData || {
          visibility: 'public',
          allow_messages: true,
          profile_music_url: '',
          theme: THEME_PRESETS[0]
        }
      };

      setProfile(extendedProfile);
      setAvatarPreview(userData.profile_picture);
      setCoverPreview(userData.cover_image);
      
      if (userData.theme) {
        try {
          const theme = typeof userData.theme === 'string' ? JSON.parse(userData.theme) : userData.theme;
          setCustomTheme(theme);
        } catch (e) {
          console.error('Error parsing theme:', e);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!profile || !supabase) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload files if needed
      let avatarUrl = profile.profile_picture;
      let coverUrl = profile.cover_image;

      if (avatarFile) {
        await uploadUserAvatar(user.id, avatarFile);
        avatarUrl = `/api/avatars/${user.id}`;
      }

      if (coverFile) {
        const coverUpload = await uploadUserFile(user.id, coverFile);
        coverUrl = coverUpload.url || profile.cover_image;
      }

      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          profile_picture: avatarUrl,
          cover_image: coverUrl,
          location: profile.location,
          website: profile.website,
          theme: JSON.stringify(customTheme)
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update or insert user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...profile.settings,
          theme: JSON.stringify(customTheme)
        });

      if (settingsError) throw settingsError;

      // Update profile sections
      for (const section of profile.sections) {
        if (String(section.id).startsWith('temp_')) {
          // New section
          const { error } = await supabase
            .from('profile_sections')
            .insert({
              user_id: user.id,
              section_type: section.section_type,
              title: section.title,
              content: section.content,
              section_order: section.section_order,
              visible: section.visible,
              style_config: JSON.stringify(section.style_config)
            });
          if (error) throw error;
        } else {
          // Existing section
          const { error } = await supabase
            .from('profile_sections')
            .update({
              title: section.title,
              content: section.content,
              section_order: section.section_order,
              visible: section.visible,
              style_config: JSON.stringify(section.style_config)
            })
            .eq('id', section.id);
          if (error) throw error;
        }
      }

      // Update social links
      for (const link of profile.social_links) {
        if (String(link.id).startsWith('temp_')) {
          // New link
          const { error } = await supabase
            .from('social_links')
            .insert({
              user_id: user.id,
              platform: link.platform,
              url: link.url,
              display_text: link.display_text,
              icon: link.icon,
              visible: link.visible,
              link_order: link.link_order
            });
          if (error) throw error;
        } else {
          // Existing link
          const { error } = await supabase
            .from('social_links')
            .update({
              url: link.url,
              display_text: link.display_text,
              visible: link.visible,
              link_order: link.link_order
            })
            .eq('id', link.id);
          if (error) throw error;
        }
      }

      setMessage('Profile saved successfully!');
      setAvatarFile(null);
      setCoverFile(null);
      
      // Reload profile to get updated data
      await loadProfile();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: string) => {
    if (!profile) return;

    const sectionType = SECTION_TYPES.find(s => s.type === type);
    const newSection: ProfileSection = {
      id: `temp_${Date.now()}`,
      section_type: type,
      title: sectionType?.title || 'New Section',
      content: '',
      section_order: profile.sections.length,
      visible: true,
      style_config: {}
    };

    setProfile({
      ...profile,
      sections: [...profile.sections, newSection]
    });
  };

  const updateSection = (id: string, updates: Partial<ProfileSection>) => {
    if (!profile) return;

    setProfile({
      ...profile,
      sections: profile.sections.map(section =>
        section.id === id ? { ...section, ...updates } : section
      )
    });
  };

  const removeSection = (id: string) => {
    if (!profile) return;

    setProfile({
      ...profile,
      sections: profile.sections.filter(section => section.id !== id)
    });
  };

  const addSocialLink = (platform: string) => {
    if (!profile) return;

    const platformData = SOCIAL_PLATFORMS.find(p => p.name === platform);
    const newLink: SocialLink = {
      id: `temp_${Date.now()}`,
      platform,
      url: '',
      display_text: platform,
      icon: platformData?.icon || '🔗',
      visible: true,
      link_order: profile.social_links.length
    };

    setProfile({
      ...profile,
      social_links: [...profile.social_links, newLink]
    });
  };

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    if (!profile) return;

    setProfile({
      ...profile,
      social_links: profile.social_links.map(link =>
        link.id === id ? { ...link, ...updates } : link
      )
    });
  };

  const removeSocialLink = (id: string) => {
    if (!profile) return;

    setProfile({
      ...profile,
      social_links: profile.social_links.filter(link => link.id !== id)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gradient">Profile Editor</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`btn ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {previewMode ? '✏️ Edit' : '👁️ Preview'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {message && (
                <div className="alert alert-success text-sm px-3 py-1">
                  {message}
                </div>
              )}
              {error && (
                <div className="alert alert-error text-sm px-3 py-1">
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Saving...
                  </>
                ) : (
                  '💾 Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          <ProfilePreview profile={profile} theme={customTheme} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <nav className="space-y-2">
                  {[
                    { id: 'basic', label: '👤 Basic Info', icon: '👤' },
                    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
                    { id: 'sections', label: '📝 Sections', icon: '📝' },
                    { id: 'social', label: '🔗 Social Links', icon: '🔗' },
                    { id: 'privacy', label: '🔒 Privacy', icon: '🔒' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'basic' && (
                <BasicInfoTab
                  profile={profile}
                  setProfile={setProfile}
                  avatarFile={avatarFile}
                  setAvatarFile={setAvatarFile}
                  coverFile={coverFile}
                  setCoverFile={setCoverFile}
                  avatarPreview={avatarPreview}
                  setAvatarPreview={setAvatarPreview}
                  coverPreview={coverPreview}
                  setCoverPreview={setCoverPreview}
                />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab
                  customTheme={customTheme}
                  setCustomTheme={setCustomTheme}
                  backgroundType={backgroundType}
                  setBackgroundType={setBackgroundType}
                  backgroundImage={backgroundImage}
                  setBackgroundImage={setBackgroundImage}
                />
              )}

              {activeTab === 'sections' && (
                <SectionsTab
                  sections={profile.sections}
                  addSection={addSection}
                  updateSection={updateSection}
                  removeSection={removeSection}
                />
              )}

              {activeTab === 'social' && (
                <SocialTab
                  socialLinks={profile.social_links}
                  addSocialLink={addSocialLink}
                  updateSocialLink={updateSocialLink}
                  removeSocialLink={removeSocialLink}
                />
              )}

              {activeTab === 'privacy' && (
                <PrivacyTab
                  settings={profile.settings}
                  updateSettings={(updates: Partial<UserSettings>) => setProfile({
                    ...profile,
                    settings: { ...profile.settings, ...updates }
                  })}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Basic Info Tab Component
function BasicInfoTab({ 
  profile, 
  setProfile, 
  avatarFile, 
  setAvatarFile, 
  coverFile, 
  setCoverFile,
  avatarPreview,
  setAvatarPreview,
  coverPreview,
  setCoverPreview
}: any) {
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      {/* Cover Photo */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Cover Photo</h3>
        <div className="relative">
          <div 
            className="w-full h-48 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg overflow-hidden"
            style={{
              backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <label className="btn btn-secondary cursor-pointer">
                📷 Change Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture & Basic Info */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-6">Profile Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={avatarPreview || '/default-avatar.png'}
                alt="Profile"
                className="avatar-2xl"
              />
              <label className="absolute bottom-0 right-0 btn btn-primary rounded-full p-2 cursor-pointer">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Click to upload a new profile picture
            </p>
          </div>

          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Your unique username"
              />
            </div>

            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                className="input"
                value={profile.display_name || ''}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="How you want to be displayed"
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                className="input"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="label">Website</label>
              <input
                type="url"
                className="input"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="label">Bio</label>
          <textarea
            className="textarea"
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell the world about yourself..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab({ 
  customTheme, 
  setCustomTheme, 
  backgroundType, 
  setBackgroundType,
  backgroundImage,
  setBackgroundImage
}: any) {
  return (
    <div className="space-y-8">
      {/* Theme Presets */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Theme Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setCustomTheme(preset)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                customTheme.name === preset.name
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <span className="font-medium">{preset.name}</span>
              </div>
              <div className="flex space-x-1">
                {Object.values(preset.colors).slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Custom Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(customTheme.colors).map(([key, value]) => (
            <div key={key}>
              <label className="label capitalize">{key.replace('_', ' ')}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={value as string}
                  onChange={(e) => setCustomTheme({
                    ...customTheme,
                    colors: { ...customTheme.colors, [key]: e.target.value }
                  })}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => setCustomTheme({
                    ...customTheme,
                    colors: { ...customTheme.colors, [key]: e.target.value }
                  })}
                  className="input flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Options */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Background</h3>
        <div className="space-y-4">
          <div className="flex space-x-4">
            {['color', 'gradient', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => setBackgroundType(type)}
                className={`btn ${backgroundType === type ? 'btn-primary' : 'btn-secondary'}`}
              >
                {type === 'color' && '🎨'} 
                {type === 'gradient' && '🌈'} 
                {type === 'image' && '🖼️'} 
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {backgroundType === 'image' && (
            <div>
              <label className="label">Background Image URL</label>
              <input
                type="url"
                className="input"
                value={backgroundImage}
                onChange={(e) => setBackgroundImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sections Tab Component
function SectionsTab({ sections, addSection, updateSection, removeSection }: any) {
  return (
    <div className="space-y-8">
      {/* Add Section */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Section</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SECTION_TYPES.map((type) => (
            <button
              key={type.type}
              onClick={() => addSection(type.type)}
              className="btn btn-secondary p-4 flex flex-col items-center space-y-2"
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-sm">{type.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Sections */}
      <div className="space-y-4">
        {sections.map((section: ProfileSection, index: number) => (
          <div key={section.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {SECTION_TYPES.find(t => t.type === section.section_type)?.icon || '✨'}
                </span>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="input font-semibold"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={(e) => updateSection(section.id, { visible: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Visible</span>
                </label>
                <button
                  onClick={() => removeSection(section.id)}
                  className="btn btn-ghost text-red-600 hover:bg-red-50"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              className="textarea"
              placeholder={`Add content for your ${section.title.toLowerCase()} section...`}
              rows={4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Social Tab Component
function SocialTab({ socialLinks, addSocialLink, updateSocialLink, removeSocialLink }: any) {
  return (
    <div className="space-y-8">
      {/* Add Social Link */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Add Social Platform</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <button
              key={platform.name}
              onClick={() => addSocialLink(platform.name)}
              className="btn btn-secondary p-4 flex flex-col items-center space-y-2"
            >
              <span className="text-2xl">{platform.icon}</span>
              <span className="text-sm">{platform.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Social Links */}
      <div className="space-y-4">
        {socialLinks.map((link: SocialLink) => {
          const platform = SOCIAL_PLATFORMS.find(p => p.name === link.platform);
          return (
            <div key={link.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{link.icon}</span>
                  <h4 className="font-semibold">{link.platform}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={link.visible}
                      onChange={(e) => updateSocialLink(link.id, { visible: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Visible</span>
                  </label>
                  <button
                    onClick={() => removeSocialLink(link.id)}
                    className="btn btn-ghost text-red-600 hover:bg-red-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">URL or Username</label>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                    className="input"
                    placeholder={platform?.placeholder || 'Enter URL or username'}
                  />
                </div>
                <div>
                  <label className="label">Display Text</label>
                  <input
                    type="text"
                    value={link.display_text}
                    onChange={(e) => updateSocialLink(link.id, { display_text: e.target.value })}
                    className="input"
                    placeholder="How it appears on your profile"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Privacy Tab Component
function PrivacyTab({ settings, updateSettings }: any) {
  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-6">Privacy Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="label">Profile Visibility</label>
            <select
              value={settings.visibility}
              onChange={(e) => updateSettings({ visibility: e.target.value })}
              className="input"
            >
              <option value="public">🌍 Public - Anyone can view</option>
              <option value="friends">👥 Friends Only</option>
              <option value="private">🔒 Private - Only me</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Messages</h4>
              <p className="text-sm text-gray-600">Let other users send you messages</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.allow_messages}
                onChange={(e) => updateSettings({ allow_messages: e.target.checked })}
              />
              <span className="toggle-thumb"></span>
            </label>
          </div>

          <div>
            <label className="label">Profile Music URL</label>
            <input
              type="url"
              value={settings.profile_music_url || ''}
              onChange={(e) => updateSettings({ profile_music_url: e.target.value })}
              className="input"
              placeholder="https://open.spotify.com/track/10kLa8lJGR7y39j5arTp2T"
            />
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">
                🎵 Add a Spotify song, album, playlist, or artist that plays when people visit your profile
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Track: https://open.spotify.com/track/10kLa8lJGR7y39j5arTp2T</p>
                <p>• Album: https://open.spotify.com/album/...</p>
                <p>• Playlist: https://open.spotify.com/playlist/...</p>
                <p>• Artist: https://open.spotify.com/artist/...</p>
              </div>
              {settings.profile_music_url && isSpotifyUrl(settings.profile_music_url) && (
                <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🎵</span>
                    <p className="text-sm font-semibold text-gray-700">Live Preview:</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Preview Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                        <span className="text-green-600 animate-pulse">🎵</span>
                        <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          Now Playing
                        </span>
                      </h4>
                    </div>
                    
                    {/* Preview Player */}
                    <div className="p-4">
                      <div className="relative w-full">
                        <div className="relative w-full" style={{ paddingBottom: '60%', minHeight: '200px' }}>
                          <iframe
                            data-testid="embed-iframe"
                            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                            src={convertSpotifyUrlToEmbed(settings.profile_music_url)}
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ 
                              borderRadius: '8px',
                              minHeight: '200px',
                              maxHeight: '300px'
                            }}
                          ></iframe>
                        </div>
                        
                        {/* Small decorative elements */}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-60 animate-ping"></div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          �� This is how it will appear on your profile
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Preview Component
function ProfilePreview({ profile, theme }: any) {
  const themeStyles = {
    '--primary': theme.colors.primary,
    '--secondary': theme.colors.secondary,
    '--accent': theme.colors.accent,
    '--background': theme.colors.background,
    '--surface': theme.colors.surface,
    '--text': theme.colors.text
  } as React.CSSProperties;

  return (
    <div className="profile-preview" style={themeStyles}>
      <div className="relative">
        {/* Cover Photo */}
        <div 
          className="w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-600"
          style={{
            backgroundImage: profile.cover_image ? `url(${profile.cover_image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Profile Info */}
        <div className="relative -mt-16 px-6">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={profile.profile_picture || '/default-avatar.png'}
              alt={profile.display_name || profile.username}
              className="avatar-2xl border-4 border-white shadow-lg"
            />
            
            <div className="flex-1 bg-white rounded-lg p-6 shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.display_name || profile.username}
              </h1>
              {profile.display_name && profile.username !== profile.display_name && (
                <p className="text-gray-600">@{profile.username}</p>
              )}
              {profile.location && (
                <p className="text-gray-600 flex items-center mt-1">
                  📍 {profile.location}
                </p>
              )}
              {profile.website && (
                <p className="text-gray-600 flex items-center mt-1">
                  🔗 <a href={profile.website} className="text-indigo-600 hover:underline ml-1">
                    {profile.website}
                  </a>
                </p>
              )}
              {profile.bio && (
                <p className="text-gray-700 mt-3">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        {profile.social_links.filter((link: SocialLink) => link.visible && link.url).length > 0 && (
          <div className="px-6 mt-6">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Connect with me</h3>
              <div className="flex flex-wrap gap-3">
                {profile.social_links
                  .filter((link: SocialLink) => link.visible && link.url)
                  .map((link: SocialLink) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <span>{link.icon}</span>
                      <span>{link.display_text}</span>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Sections */}
        <div className="px-6 mt-6 space-y-6">
          {profile.sections
            .filter((section: ProfileSection) => section.visible && section.content)
            .sort((a: ProfileSection, b: ProfileSection) => a.section_order - b.section_order)
            .map((section: ProfileSection) => (
              <div key={section.id} className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">
                    {SECTION_TYPES.find(t => t.type === section.section_type)?.icon || '✨'}
                  </span>
                  {section.title}
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}