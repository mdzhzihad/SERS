import { Profile, Post, Comment } from '../types';

// Real default user configuration fallbacks (no mock user larping)
export const mockCurrentUser: Profile = {
  id: 'local_admin',
  username: 'sers_admin',
  display_name: 'SERS Companion',
  avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=sers_admin',
  bio: 'Official administrative account of SERS.',
  created_at: new Date().toISOString()
};

export const mockProfiles: Profile[] = [];

export const initialPosts: Post[] = [];

export const initialComments: Comment[] = [];

export const mockTrending = [
  { topic: 'SERS_Main', category: 'Technology', posts: '1.2K' },
  { topic: 'PostgreSQL_RLS', category: 'Backend', posts: '4.5K' },
  { topic: 'Tailwindv4', category: 'Design Systems', posts: '3.1K' },
  { topic: 'SupabaseDB', category: 'Database', posts: '5.2K' },
  { topic: 'React19', category: 'Web Development', posts: '10.9K' },
];
