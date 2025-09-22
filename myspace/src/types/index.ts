export interface User {
  id: string;
  username: string;
  email: string;
  bio: string;
  profile_picture: string;
  background_style: string;
  created_at: string;
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