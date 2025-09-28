export interface User {
  id: string;
  username: string;
  email: string;
  bio: string;
  profile_picture: string;
  background_style: string;
  display_name?: string;
  location?: string;
  website?: string;
  cover_image?: string;
  theme?: any;
  sections?: any;
  social_links?: any;
  profile_views?: number;
  last_active?: string;
  created_at: string;
}

export interface ProfileSection {
  id: string;
  user_id: string;
  section_type: string;
  title: string;
  content: string;
  section_order: number;
  visible: boolean;
  style_config?: any;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  display_text?: string;
  icon?: string;
  visible: boolean;
  link_order: number;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  visibility: 'public' | 'friends' | 'private';
  allow_messages: boolean;
  profile_music_url?: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  digest_frequency: 'off' | 'daily' | 'weekly' | 'monthly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  theme?: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id?: string;
  viewed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}