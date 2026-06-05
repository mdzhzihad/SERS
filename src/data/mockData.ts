import { Profile, Post, Comment } from '../types';

export const mockCurrentUser: Profile = {
  id: 'user_zack',
  username: 'zack_owl',
  display_name: 'Zack Torres',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  bio: 'Full-stack developer building with React, Next.js, and Tailwind CSS. Working on SERS!',
  created_at: '2026-01-15T08:00:00Z'
};

export const mockProfiles: Profile[] = [
  mockCurrentUser,
  {
    id: 'user_samantha',
    username: 'samantha_dev',
    display_name: 'Samantha Vance',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    bio: 'Lead DX Engineer @ Vercel. Next.js enthusiast. Coffee drinker. Standardizing micro-frontends.',
    created_at: '2025-10-12T14:32:00Z'
  },
  {
    id: 'user_elena',
    username: 'elena_ux',
    display_name: 'Elena Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    bio: 'Visual Artisan & UI Engineer. Crafting beautiful CSS variables and high-contrast color palettes.',
    created_at: '2025-11-05T09:15:00Z'
  },
  {
    id: 'user_marcus',
    username: 'marcus_db',
    display_name: 'Marcus Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'Backend & Database design wizard. PostgreSQL, Supabase Row-Level Security rules, and edge functions developer.',
    created_at: '2025-08-20T11:45:00Z'
  }
];

export const initialPosts: Post[] = [
  {
    id: 'post_1',
    profile_id: 'user_samantha',
    content: 'Just deployed a new Next.js App Router boilerplate optimized for Supabase SSR Auth. The speed of edge-rendered layouts is mind-blowing! Fully secure with PostgreSQL RLS. Who is building on v15 already?',
    created_at: '2026-06-05T19:42:00Z',
    author: mockProfiles[1],
    likes_count: 42,
    comments_count: 3,
    liked_by_me: true
  },
  {
    id: 'post_2',
    profile_id: 'user_marcus',
    content: 'Pro tip for Supabase developers: Always use SECURITY DEFINER functions very sparingly, and carefully validate search_path configuration on triggers. Keeping your row-level security tight is rule #1 for public client endpoints! 🔐 #postgresql #supabase',
    created_at: '2026-06-05T18:15:00Z',
    author: mockProfiles[3],
    likes_count: 28,
    comments_count: 1,
    liked_by_me: false
  },
  {
    id: 'post_3',
    profile_id: 'user_elena',
    content: 'Testing out the new Tailwind CSS v4.0 `@theme` structures. Having fluid design tokens mapped natively inside CSS makes files so compact. No more bulky custom configurations in JS! What is your favorite utility class in tailwind? ✨',
    created_at: '2026-06-05T15:30:00Z',
    author: mockProfiles[2],
    likes_count: 56,
    comments_count: 2,
    liked_by_me: false
  },
  {
    id: 'post_4',
    profile_id: 'user_zack',
    content: 'Excited to showcase \"SERS\" — a micro-blogging platform. Under the hood, it replicates the Twitter-grade 3-column architectural pattern. Built with full lightning-fast optimistic updates!',
    created_at: '2026-06-05T12:00:00Z',
    author: mockCurrentUser,
    likes_count: 12,
    comments_count: 2,
    liked_by_me: false
  }
];

export const initialComments: Comment[] = [
  {
    id: 'comment_1_1',
    post_id: 'post_1',
    profile_id: 'user_marcus',
    content: 'Fully agree, Samantha! Connecting Supabase Auth with server-side layout pre-fetching makes the initial paint sub-100ms. No hydration layout shifts at all.',
    created_at: '2026-06-05T19:50:00Z',
    author: mockProfiles[3]
  },
  {
    id: 'comment_1_2',
    post_id: 'post_1',
    profile_id: 'user_zack',
    content: 'Running Supabase Auth callbacks inside middleware makes auth checks secure and prevents flashes. Would highly recommend this setup!',
    created_at: '2026-06-05T19:58:00Z',
    author: mockCurrentUser
  },
  {
    id: 'comment_1_3',
    post_id: 'post_1',
    profile_id: 'user_elena',
    content: 'The DX is outstanding. Can\'t wait to see more boilerplates around this structure.',
    created_at: '2026-06-05T20:10:00Z',
    author: mockProfiles[2]
  },
  {
    id: 'comment_2_1',
    post_id: 'post_2',
    profile_id: 'user_samantha',
    content: 'Excellent advice. I ran into a search_path exploit last month on an old codebase. Always define those cleanly.',
    created_at: '2026-06-05T18:30:00Z',
    author: mockProfiles[1]
  },
  {
    id: 'comment_3_1',
    post_id: 'post_3',
    profile_id: 'user_zack',
    content: 'The custom border utilities in Tailwind v4 are incredible. Makes active layout transitions so smooth combined with motion.',
    created_at: '2026-06-05T16:00:00Z',
    author: mockCurrentUser
  },
  {
    id: 'comment_3_2',
    post_id: 'post_3',
    profile_id: 'user_marcus',
    content: 'Natively compiled styles inside postcss/vite pipelines speed up dev build. Tailwind v4 is gorgeous.',
    created_at: '2026-06-05T16:15:00Z',
    author: mockProfiles[3]
  },
  {
    id: 'comment_4_1',
    post_id: 'post_4',
    profile_id: 'user_elena',
    content: 'The 3-column layout feels extremely professional and light. The responsive collapsing works flawlessly on my mobile testing unit.',
    created_at: '2026-06-05T12:20:00Z',
    author: mockProfiles[2]
  },
  {
    id: 'comment_4_2',
    post_id: 'post_4',
    profile_id: 'user_marcus',
    content: 'The likes counter responds immediately with optimistic state! Looking forward to viewing the full relational schemas in the dashboard.',
    created_at: '2026-06-05T12:35:00Z',
    author: mockProfiles[3]
  }
];

export const mockTrending = [
  { topic: 'NextJS', category: 'Technology', posts: '14.2K' },
  { topic: 'SupabaseAuth', category: 'Backend', posts: '8.5K' },
  { topic: 'TailwindCSS_v4', category: 'Design Systems', posts: '22.1K' },
  { topic: 'RLS_Security', category: 'Database Security', posts: '3.1K' },
  { topic: 'React19', category: 'Web Development', posts: '18.9K' },
];
