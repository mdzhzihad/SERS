export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface Post {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  author: Profile;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  author: Profile;
}

export type ActiveTab = 'home' | 'profile' | 'bookmarks' | 'dev-console';
