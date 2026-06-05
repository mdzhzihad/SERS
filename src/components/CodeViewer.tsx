import React, { useState } from 'react';
import { Copy, Check, FileCode2, Database, FolderTree, FileJson, ShieldAlert } from 'lucide-react';

interface CodeBlock {
  id: string;
  title: string;
  filename: string;
  icon: React.ReactNode;
  language: string;
  code: string;
}

export default function CodeViewer() {
  const [activeTab, setActiveTab] = useState<string>('database');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const deliverables: CodeBlock[] = [
    {
      id: 'database',
      title: '1. Supabase SQL Schema',
      filename: 'schema.sql',
      icon: <Database className="w-4 h-4 text-violet-500" />,
      language: 'sql',
      code: `-- SERS Micro-Blogging App SQL Schema
-- 1. Create Profiles Table (syncs with Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Create Posts Table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content VARCHAR(280) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Likes Table (Unique post-user pairing)
CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, profile_id)
);

-- 4. Create Comments Table (Nested threads)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6. Define Security Policies (RLS Policies)
-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can edit their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = profile_id);

-- Likes Policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike posts" ON public.likes
  FOR DELETE USING (auth.uid() = profile_id);

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = profile_id);

-- 7. Automatic Handler: Sync Supabase Auth Signup to Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://avatar.vercel.sh/' || new.id),
    'Web developer onboarded onto SERS.'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Add Performance Indexes
CREATE INDEX INX_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX INX_likes_post_id ON public.likes(post_id);
CREATE INDEX INX_comments_post_id ON public.comments(post_id);`
    },
    {
      id: 'structure',
      title: '2. Next.js App Directory Layout',
      filename: 'Structure.txt',
      icon: <FolderTree className="w-4 h-4 text-emerald-500" />,
      language: 'text',
      code: `SERS Micro-blogging Next.js Architecture
├── app/
│   ├── api/
│   │   ├── posts/
│   │   │   └── route.ts         # Serverless API for dynamic posts
│   │   └── likes/
│   │       └── [postId]/
│   │           └── route.ts     # Optimistic like action handlers
│   ├── auth/
│   │   ├── signup/              # Supabase email or PKCE page
│   │   ├── login/               # Password / Magic Link views
│   │   └── callback/
│   │       └── route.ts         # Handles code exchange for SSR flow
│   ├── profile/
│   │   └── [username]/
│   │       └── page.tsx         # User Specific timelines
│   ├── globals.css              # Importing tailwind directives
│   ├── layout.tsx               # Root configuration (dark/light, provider contexts)
│   └── page.tsx                 # Core Twitter-style Chronological Timeline Feed
├── components/
│   ├── sidebar-navigation.tsx   # Sidebar Controller
│   ├── feed-compositor.tsx      # Main text card (max 280 characters limiter)
│   ├── post-card.tsx            # Optimized post card with optimistic metrics state
│   ├── comments-modal.tsx       # Live comment feed container
│   └── theme-provider.tsx       # Next-themes client loader wrapper
├── lib/
│   └── supabase/
│       ├── client.ts            # Client-side Supabase Browser Client instance
│       ├── server.ts            # SSR helper configuration (Server Actions)
│       └── middleware.ts        # Updates session token and handles auth routes
├── types/
│   └── database.types.ts        # Fully generated PostgreSQL Schema definitions
├── middleware.ts                # Next.js global route matching middleware
├── package.json
└── tailwind.config.ts`
    },
    {
      id: 'layout',
      title: '3. Next.js Root Layout',
      filename: 'app/layout.tsx',
      icon: <FileCode2 className="w-4 h-4 text-blue-500" />,
      language: 'typescript',
      code: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SERS - Connect and Share",
  description: "A cutting edge micro-blogging application built with Next.js, Tailwind v4 and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={\`\${inter.className} bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased min-h-screen transition-colors duration-200\`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}`
    },
    {
      id: 'feed',
      title: '4. Next.js Feed page.tsx',
      filename: 'app/page.tsx',
      icon: <FileCode2 className="w-4 h-4 text-violet-500" />,
      language: 'typescript',
      code: `"use client";

import { useEffect, useState, useOptimistic } from "react";
import { createClient } from "@/lib/supabase/client";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { PostCard } from "@/components/post-card";
import { Sparkles, MessageCircle, Heart, Share2, CornerDownRight } from "lucide-react";

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
  comments_count: number;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load posts chronological timeline from Supabase Database
  async function fetchFeed() {
    const { data, error } = await supabase
      .from("posts")
      .select(\`
        id, content, created_at,
        profiles(username, display_name, avatar_url),
        likes(profile_id),
        comments(id)
      \`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Timeline loading failed:", error.message);
      return;
    }

    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const formattedPosts: Post[] = (data || []).map((p: any) => ({
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      likes_count: p.likes?.length || 0,
      liked_by_user: p.likes?.some((l: any) => l.profile_id === currentUserId) || false,
      comments_count: p.comments?.length || 0,
      profiles: p.profiles
    }));

    setPosts(formattedPosts);
    setLoading(false);
  }

  // Handle new post compose action (limit 280 characters)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.length > 280) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login first to write on SERS feed!");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .insert({ profile_id: user.id, content: content.trim() });

    if (error) {
      console.error(error.message);
    } else {
      setContent("");
      fetchFeed(); // Refresh the feed after successful database write
    }
  }

  // Optimistic Likes Updater mechanism to zero-latency feedback
  const [optimisticPosts, setOptimisticLikes] = useOptimistic(
    posts,
    (state, { postId, liked_by_user }) =>
      state.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user,
            likes_count: liked_by_user ? post.likes_count + 1 : post.likes_count - 1
          };
        }
        return post;
      })
  );

  async function handleLikeToggle(postId: string, currentLiked: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Trigger UI change instantaneously
    setOptimisticLikes({ postId, liked_by_user: !currentLiked });

    if (currentLiked) {
      // Unlike post
      await supabase
        .from("likes")
        .delete()
        .match({ post_id: postId, profile_id: user.id });
    } else {
      // Like post
      await supabase
        .from("likes")
        .insert({ post_id: postId, profile_id: user.id });
    }
    fetchFeed(); // sync accurate state from DB
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="flex justify-center max-w-7xl mx-auto min-h-screen">
      {/* 3-Column: Column 1 - Left Sidebar */}
      <SidebarNavigation />

      {/* 3-Column: Column 2 - Main central feed */}
      <main className="flex-1 max-w-2xl border-x border-slate-200 dark:border-zinc-800 min-h-screen pb-16">
        <header className="sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 p-4 font-bold tracking-tight text-xl z-10 flex justify-between items-center">
          <span>Home Feed</span>
          <Sparkles className="w-5 h-5 text-violet-600" />
        </header>

        {/* Compositor Box */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is happening on SERS today?"
            maxLength={280}
            className="w-full bg-transparent resize-none outline-none border-b border-transparent focus:border-violet-600/20 text-lg py-2 min-h-[100px] text-slate-800 dark:text-zinc-100"
          />
          <div className="flex justify-between items-center transition-all">
            <span className={\`text-xs font-mono \${content.length > 250 ? "text-amber-500" : "text-slate-400"}\`}>
              {content.length}/280 Characters
            </span>
            <button
              type="submit"
              disabled={!content.trim() || content.length > 280}
              className="bg-violet-600 text-white font-semibold text-sm px-5 py-2 rounded-full cursor-pointer hover:bg-violet-700 transition disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>

        {/* Feed Timeline list */}
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono">Loading chronological stream...</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-zinc-800">
            {optimisticPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onLike={() => handleLikeToggle(p.id, p.liked_by_user)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3-Column: Column 3 - Discovery Panel */}
      <aside className="w-80 hidden lg:block p-4 space-y-6">
        {/* Search & trends here */}
      </aside>
    </div>
  );
}`
    },
    {
      id: 'api-mid',
      title: '5. Next.js API & Middleware',
      filename: 'API & Auth Middleware',
      icon: <FileJson className="w-4 h-4 text-emerald-500" />,
      language: 'typescript',
      code: `// File 1: /app/api/posts/route.ts
// Secure HTTP Route for posting validation
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { content } = await request.json();

    if (!content || content.length > 280) {
      return NextResponse.json({ error: "Invalid content length. Max 280 chars." }, { status: 400 });
    }

    // Authenticate the active token inside cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access detected." }, { status: 401 });
    }

    const { data: post, error: dbError } = await supabase
      .from("posts")
      .insert({
        profile_id: user.id,
        content: content.trim()
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// File 2: /middleware.ts
// Supabase Session Management & Root Middleware Route Protection
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh cookie session automatically
  const { data: { user } } = await supabase.auth.getUser();

  // Safeguard private dashboard route categories
  if (!user && request.nextUrl.pathname.startsWith("/profile")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to customize for your own patterns.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};`
    }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeBlock = deliverables.find(d => d.id === activeTab) || deliverables[0];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      {/* Tab Select Header */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-1 divide-x divide-slate-200 dark:divide-zinc-800 scrollbar-none">
        {deliverables.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              activeTab === item.id
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 font-bold border-b-2 border-b-violet-600'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}
      </div>

      {/* Code Viewer Display */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">{activeBlock.filename}</span>
            <span className="bg-slate-200 dark:bg-zinc-800 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400">
              {activeBlock.language}
            </span>
          </div>
          <button
            onClick={() => handleCopy(activeBlock.id, activeBlock.code)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer transition active:scale-95"
          >
            {copiedId === activeBlock.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy Raw Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] sm:text-xs leading-relaxed max-h-[500px]">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{activeBlock.code}</code>
          </pre>
        </div>
      </div>

      {/* Mini warning informational footer */}
      <div className="bg-violet-50 dark:bg-violet-950/20 px-4 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-800 dark:text-violet-300">
          <strong>Production Notice:</strong> Ensure you configure the corresponding environment variables in your Next.js project's <code>.env.local</code> file (<code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) before deploying!
        </p>
      </div>
    </div>
  );
}
