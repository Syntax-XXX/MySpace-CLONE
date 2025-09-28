"use client";
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { ProfileSection, SocialLink, UserSettings } from '../types';
import { convertSpotifyUrlToEmbed, isSpotifyUrl } from '../utils/helpers';

interface ModernProfileViewProps {
  userId: string;
  isOwnProfile?: boolean;
}

interface ExtendedUser {
  id: string;
  username: string;
  display_name?: string;
  email?: string;
  bio?: string;
  profile_picture?: string;
  cover_image?: string;
  location?: string;
  website?: string;
  theme?: any;
  profile_views?: number;
  last_active?: string;
  created_at: string;
}

export default function ModernProfileView({ userId, isOwnProfile = false }: ModernProfileViewProps) {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    getCurrentUser();
  }, [userId]);

  const getCurrentUser = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProfile = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Load profile sections
      const { data: sectionsData } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('user_id', userId)
        .eq('visible', true)
        .order('section_order');

      // Load social links
      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', userId)
        .eq('visible', true)
        .order('link_order');

      // Load user settings (only if own profile or public)
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      setUser(userData);
      setSections(sectionsData || []);
      setSocialLinks(socialData || []);
      setSettings(settingsData);

      // Track profile view (if not own profile)
      if (!isOwnProfile && currentUser && currentUser.id !== userId) {
        await supabase
          .from('profile_views')
          .insert({
            profile_id: userId,
            viewer_id: currentUser.id
          });
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-600">{error || 'This profile does not exist or is private.'}</p>
        </div>
      </div>
    );
  }

  // Parse theme
  let theme = null;
  try {
    theme = user.theme ? (typeof user.theme === 'string' ? JSON.parse(user.theme) : user.theme) : null;
  } catch (e) {
    console.error('Error parsing theme:', e);
  }

  const themeStyles = theme ? {
    '--primary': theme.colors?.primary || '#6366f1',
    '--secondary': theme.colors?.secondary || '#8b5cf6',
    '--accent': theme.colors?.accent || '#a78bfa',
    '--background': theme.colors?.background || '#fafafa',
    '--surface': theme.colors?.surface || '#ffffff',
    '--text': theme.colors?.text || '#1e293b'
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen" style={themeStyles}>
      {/* Cover Photo */}
      <div className="relative">
        <div 
          className="w-full h-64 md:h-80 bg-gradient-to-r from-indigo-500 to-purple-600"
          style={{
            backgroundImage: user.cover_image ? `url(${user.cover_image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        
        {/* Profile Header */}
        <div className="relative -mt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={user.profile_picture || '/default-avatar.png'}
                alt={user.display_name || user.username}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
              
              <div className="flex-1 bg-white rounded-lg p-6 shadow-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                      {user.display_name || user.username}
                    </h1>
                    {user.display_name && user.username !== user.display_name && (
                      <p className="text-gray-600">@{user.username}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      {user.location && (
                        <span className="flex items-center">
                          📍 {user.location}
                        </span>
                      )}
                      {user.website && (
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline"
                          style={{ color: 'var(--primary)' }}
                        >
                          🔗 {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                      <span className="flex items-center">
                        📅 Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      {user.profile_views && (
                        <span className="flex items-center">
                          👁️ {user.profile_views} views
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="mt-4 md:mt-0">
                      <a
                        href="/profile/settings"
                        className="btn btn-primary"
                      >
                        ✏️ Edit Profile
                      </a>
                    </div>
                  )}
                </div>
                
                {user.bio && (
                  <p className="mt-4 text-gray-700 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Connect
                </h3>
                <div className="space-y-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--text)' }}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.display_text || link.platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Music Player */}
            {settings?.profile_music_url && (
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100" style={{ borderColor: 'var(--primary)', borderOpacity: '0.1' }}>
                  <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text)' }}>
                    <span className="text-2xl animate-pulse">🎵</span>
                    <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      Now Playing
                    </span>
                  </h3>
                </div>
                
                {/* Spotify Player Container */}
                <div className="p-6">
                  <div className="relative w-full">
                    {/* Responsive iframe container */}
                    <div className="relative w-full" style={{ paddingBottom: '126%', minHeight: '380px' }}>
                      <iframe
                        data-testid="embed-iframe"
                        className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
                        src={isSpotifyUrl(settings.profile_music_url) 
                          ? convertSpotifyUrlToEmbed(settings.profile_music_url)
                          : settings.profile_music_url
                        }
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        style={{ 
                          borderRadius: '12px',
                          minHeight: '380px',
                          maxHeight: '500px'
                        }}
                      ></iframe>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full opacity-60 animate-ping"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full opacity-40"></div>
                  </div>
                  
                  {/* Footer note */}
                  <div className="mt-4 text-center">
                    <p className="text-xs opacity-60" style={{ color: 'var(--text)' }}>
                      🎧 Powered by Spotify
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6 shadow-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                📊 Profile Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>
                    {user.profile_views || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sections</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>
                    {sections.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Social Links</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>
                    {socialLinks.length}
                  </span>
                </div>
                {user.last_active && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Active</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>
                      {new Date(user.last_active).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {sections.length > 0 ? (
              sections.map((section) => (
                <div 
                  key={section.id} 
                  className="bg-white rounded-lg p-6 shadow-lg animate-fade-in"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text)' }}>
                    <span className="mr-3">
                      {getSectionIcon(section.section_type)}
                    </span>
                    {section.title}
                  </h3>
                  <div 
                    className="prose max-w-none whitespace-pre-wrap"
                    style={{ color: 'var(--text)' }}
                  >
                    {section.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-12 shadow-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  {isOwnProfile ? 'Your profile is ready to shine!' : 'This profile is still being crafted'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isOwnProfile 
                    ? 'Add some sections to tell your story and express yourself.'
                    : 'Check back later to see what they\'re up to!'
                  }
                </p>
                {isOwnProfile && (
                  <a
                    href="/profile/settings"
                    className="btn btn-primary"
                  >
                    🎨 Customize Profile
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSectionIcon(sectionType: string): string {
  const icons: { [key: string]: string } = {
    'about': '👤',
    'interests': '❤️',
    'music': '🎵',
    'photos': '📸',
    'blog': '📝',
    'quotes': '💭',
    'books': '📚',
    'movies': '🎬',
    'games': '🎮',
    'custom': '✨'
  };
  return icons[sectionType] || '✨';
}