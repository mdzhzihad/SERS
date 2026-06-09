import React, { useState, useEffect } from 'react';
import { Profile, Post, Comment } from './types';
import { initialPosts, initialComments, mockCurrentUser, mockProfiles } from './data/mockData';
import Sidebar from './components/Sidebar';
import PostCard from './components/PostCard';
import ProfileView from './components/ProfileView';
import ControlPanel from './components/ControlPanel';
import CodeViewer from './components/CodeViewer';
import AuthModal from './components/AuthModal';
import { Sparkles, Compass, AlertCircle, Plus, Send, X, Shield, FileText, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase, hasSupabaseKeys } from './lib/supabaseClient';

const LOCAL_STORAGE_POSTS_KEY = 'sers_client_posts_sync';
const LOCAL_STORAGE_COMMENTS_KEY = 'sers_client_comments_sync';
const LOCAL_STORAGE_USER_KEY = 'sers_client_user_session';
const LOCAL_STORAGE_THEME_KEY = 'sers_client_theme_style';

export default function App() {
  // 1. Core States
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  });
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'bookmarks' | 'dev-console'>('home');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Supabase states
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Interactive Compositor states
  const [composeContent, setComposeContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileCompose, setShowMobileCompose] = useState(false);

  // 2. Fetch Supabase Data stream and aggregate relationships locally
  const fetchSupabaseData = async () => {
    const supabase = getSupabase() as any;
    if (!supabase) return;

    setIsSyncing(true);
    setDbError(null);

    try {
      // 1. Fetch posts joined with authors (public profiles)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .order('created_at', { ascending: false });

      if (postsError) {
        if (postsError.code === 'PGRST116' || postsError.message.includes('relation "public.posts" does not exist')) {
          throw new Error('Database tables do not exist yet. Please run the SQL Script in your Supabase SQL editor!');
        }
        throw postsError;
      }

      // 2. Fetch comments with authors
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, author:profiles(*)');

      if (commentsError) throw commentsError;

      // 3. Fetch all likes for local aggregation
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*');

      if (likesError) throw likesError;

      // 4. Map & match relationships correctly
      const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;

      const formattedPosts: Post[] = (postsData || []).map((p: any) => {
        const postLikes = (likesData || []).filter((l: any) => l.post_id === p.id);
        const postCommentsCount = (commentsData || []).filter((c: any) => c.post_id === p.id).length;
        const likedByMe = currentUserId ? postLikes.some((l: any) => l.profile_id === currentUserId) : false;

        const postAuthor = p.author || {
          id: p.profile_id,
          username: 'user_' + p.profile_id.slice(0, 5),
          display_name: 'SERS Companion',
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${p.profile_id}`,
          bio: 'Peer user of SERS',
          created_at: p.created_at
        };

        return {
          id: p.id,
          profile_id: p.profile_id,
          content: p.content,
          created_at: p.created_at,
          author: postAuthor,
          likes_count: postLikes.length,
          comments_count: postCommentsCount,
          liked_by_me: likedByMe
        };
      });

      setPosts(formattedPosts);

      const formattedComments: Comment[] = (commentsData || []).map((c: any) => {
        const commentAuthor = c.author || {
          id: c.profile_id,
          username: 'user_' + c.profile_id.slice(0, 5),
          display_name: 'SERS Companion',
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${c.profile_id}`,
          bio: 'SERS commentator',
          created_at: c.created_at
        };

        return {
          id: c.id,
          post_id: c.post_id,
          profile_id: c.profile_id,
          content: c.content,
          created_at: c.created_at,
          author: commentAuthor
        };
      });

      setComments(formattedComments);

      // Successfully synced. Store in localStorage as progressive cache.
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(formattedPosts));
      localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(formattedComments));

    } catch (err: any) {
      console.warn("Supabase load failed, falling back safely:", err.message);
      setDbError(err.message);

      // Load cached posts
      const cachedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
      setPosts(cachedPosts ? JSON.parse(cachedPosts) : initialPosts);

      // Load cached comments
      const cachedComments = localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY);
      setComments(cachedComments ? JSON.parse(cachedComments) : initialComments);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Load user sessions and connect Real-time events
  useEffect(() => {
    // Sync theme settings
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as 'light' | 'dark';
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    const supabase = getSupabase() as any;
    if (!supabase) {
      // Setup missing. Load simulator defaults.
      console.log("No secrets detected. booting SERS offline sandbox.");
      const cachedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
      setPosts(cachedPosts ? JSON.parse(cachedPosts) : initialPosts);

      const cachedComments = localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY);
      setComments(cachedComments ? JSON.parse(cachedComments) : initialComments);

      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } else {
        setCurrentUser(mockCurrentUser);
        setIsLoggedIn(true);
      }
      return;
    }

    const initAuthAndSync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Retrieve public profile match
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const pRow = profileRow as any;

        // If table exists but user doesn't have a profile yet (trigger delay or custom setup fallback)
        if (!pRow) {
          // Attempt inserting public profile row instantly
          const fallbackUsername = session.user.user_metadata?.username || session.user.email!.split('@')[0];
          const fallbackName = session.user.user_metadata?.display_name || session.user.email!.split('@')[0];
          
          await supabase.from('profiles').insert({
            id: session.user.id,
            username: fallbackUsername,
            display_name: fallbackName,
            avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${session.user.id}`,
            bio: 'Just onboarded onto SERS!'
          });
        }

        const userProfile: Profile = {
          id: session.user.id,
          username: pRow?.username || session.user.user_metadata?.username || session.user.email!.split('@')[0],
          display_name: pRow?.display_name || session.user.user_metadata?.display_name || session.user.email!.split('@')[0],
          avatar_url: pRow?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${session.user.id}`,
          bio: pRow?.bio || 'SERS microblogger',
          created_at: session.user.created_at
        };

        setCurrentUser(userProfile);
        setIsLoggedIn(true);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userProfile));
      } else {
        // Only clear if nothing is cached in localStorage to prevent transient state logouts on page load
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (!stored) {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }

      await fetchSupabaseData();
    };

    initAuthAndSync();

    // Session status channels change listeners
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const pRow = profileRow as any;

        const userProfile: Profile = {
          id: session.user.id,
          username: pRow?.username || session.user.user_metadata?.username || session.user.email!.split('@')[0],
          display_name: pRow?.display_name || session.user.user_metadata?.display_name || session.user.email!.split('@')[0],
          avatar_url: pRow?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${session.user.id}`,
          bio: pRow?.bio || 'Just joined SERS!',
          created_at: session.user.created_at
        };

        setCurrentUser(userProfile);
        setIsLoggedIn(true);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userProfile));
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
      fetchSupabaseData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 4. Synchronize theme variables
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  // 5. Post creation in SQL
  const handleCreatePost = async (contentString: string) => {
    if (!contentString.trim() || !currentUser) return;

    const supabase = getSupabase() as any;
    if (!supabase) {
      // Local state fallback insert
      const newPost: Post = {
        id: 'post_local_' + Math.random().toString(36).slice(2, 9),
        profile_id: currentUser.id,
        content: contentString.trim(),
        created_at: new Date().toISOString(),
        author: currentUser,
        likes_count: 0,
        comments_count: 0,
        liked_by_me: false,
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
      setComposeContent('');
      setShowMobileCompose(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          content: contentString.trim(),
          profile_id: currentUser.id
        });

      if (error) throw error;

      await fetchSupabaseData();
      setComposeContent('');
      setShowMobileCompose(false);
    } catch (err: any) {
      console.error("Failed to post:", err);
      alert("Oops! Post creation failed: " + err.message);
    }
  };

  // 6. Like transaction handler (Optimistic UI update)
  const handleLikeToggle = async (postId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    const supabase = getSupabase() as any;
    if (!supabase || !currentUser) {
      // Local toggles
      const updated = posts.map((post) => {
        if (post.id === postId) {
          const nextLikedState = !post.liked_by_me;
          return {
            ...post,
            liked_by_me: nextLikedState,
            likes_count: nextLikedState ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
          };
        }
        return post;
      });
      setPosts(updated);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
      return;
    }

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const originalLikedByMe = targetPost.liked_by_me;

    // Optimistically toggle
    const updated = posts.map((post) => {
      if (post.id === postId) {
        const nextLikedState = !post.liked_by_me;
        return {
          ...post,
          liked_by_me: nextLikedState,
          likes_count: nextLikedState ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
        };
      }
      return post;
    });
    setPosts(updated);

    try {
      if (originalLikedByMe) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('profile_id', currentUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            profile_id: currentUser.id
          });

        if (error) throw error;
      }
      await fetchSupabaseData();
    } catch (err: any) {
      console.error("Liking failed, rollback:", err);
      await fetchSupabaseData();
    }
  };

  // 7. Dynamic comments appending
  const handleAddComment = async (postId: string, commentString: string) => {
    if (!commentString.trim() || !currentUser) return;

    const supabase = getSupabase() as any;
    if (!supabase) {
      const newComment: Comment = {
        id: 'comment_local_' + Math.random().toString(36).slice(2, 9),
        post_id: postId,
        profile_id: currentUser.id,
        content: commentString.trim(),
        created_at: new Date().toISOString(),
        author: currentUser,
      };

      const updated = [...comments, newComment];
      setComments(updated);
      localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          profile_id: currentUser.id,
          content: commentString.trim()
        });

      if (error) throw error;

      await fetchSupabaseData();
    } catch (err: any) {
      console.error("Commenting failed:", err);
      alert("Failed to post reply: " + err.message);
    }
  };

  // 8. Profile edit handler
  const handleUpdateProfile = async (updatedFields: Partial<Profile>) => {
    if (!currentUser) return;

    const supabase = getSupabase() as any;
    if (!supabase) {
      const newProfile = { ...currentUser, ...updatedFields };
      setCurrentUser(newProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));

      // Re-map posts and comments author details instantly
      const updatedPosts = posts.map((p) => {
        if (p.profile_id === currentUser.id) return { ...p, author: newProfile };
        return p;
      });
      setPosts(updatedPosts);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

      const updatedComments = comments.map((c) => {
        if (c.profile_id === currentUser.id) return { ...c, author: newProfile };
        return c;
      });
      setComments(updatedComments);
      localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(updatedComments));

      setSelectedProfile(newProfile);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updatedFields.display_name,
          username: updatedFields.username,
          bio: updatedFields.bio,
          avatar_url: updatedFields.avatar_url,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      const updatedProfile = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedProfile);
      setSelectedProfile(updatedProfile);
      await fetchSupabaseData();
    } catch (err: any) {
      console.error("Sync profile failed:", err);
      alert("Failed to sync profile change: " + err.message);
    }
  };

  // 9. Robot Bot simulated posting triggers
  const handleSimulateBotArrival = async () => {
    const supabase = getSupabase() as any;
    if (!supabase) {
      const botPool = mockProfiles.filter(p => p.id !== currentUser?.id);
      const selectedBot = botPool[Math.floor(Math.random() * botPool.length)];

      const botPhrases = [
        "Just updated my Supabase security policies! Enabling Postgres RLS is absolutely vital.",
        "Vite + Tailwind v4 is clean. The CSS-only variables make compiling extremely light.",
        "Loving SERS so far! Re-routing Next.js directory setups into single-views yields gorgeous results.",
        "Real-time integrations combined with client-side optimisms make web applications run at true 60fps latency! 🚀"
      ];
      const randomContent = botPhrases[Math.floor(Math.random() * botPhrases.length)] + ` #${['NextJS', 'SupabaseAuth', 'Tailwindv4', 'RLS_Security', 'React19'][Math.floor(Math.random() * 5)]}`;

      const newPost: Post = {
        id: 'post_bot_' + Math.random().toString(36).slice(2, 9),
        profile_id: selectedBot.id,
        content: randomContent,
        created_at: new Date().toISOString(),
        author: selectedBot,
        likes_count: Math.floor(Math.random() * 10),
        comments_count: 0,
        liked_by_me: false
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      // Query profiles that are NOT current user to select a simulated bot profile writing online
      const { data: onlineProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id || '');

      const profilePool = onlineProfiles && onlineProfiles.length > 0 ? onlineProfiles : mockProfiles;
      const selectedBot = profilePool[Math.floor(Math.random() * profilePool.length)];

      const botPhrases = [
        "Just completed mapping my PostgreSQL RLS policies in my Supabase query editor! Extreme safety.",
        "Disabling email confirmation on Supabase lets users join instantly in development playgrounds.",
        "Row Level Security keeps the posts database tightly locked down. Only authorized profiles can write rows.",
        "SERS chronological feed orders postgres data by created_at descending. Zero-latency micro-logs!"
      ];
      const randomContent = botPhrases[Math.floor(Math.random() * botPhrases.length)] + ` #${['Supabase', 'Postgres', 'RLS', 'SERS_Main'][Math.floor(Math.random() * 4)]}`;

      const { error } = await supabase
        .from('posts')
        .insert({
          content: randomContent,
          profile_id: selectedBot.id
        });

      if (error) throw error;
      await fetchSupabaseData();
    } catch (err: any) {
      console.warn("Real-time bot insert failed, fallback local:", err.message);
    }
  };

  // 10. Tag filter click
  const handleHashtagClick = (tag: string) => {
    setSearchQuery(`#${tag}`);
    setActiveTab('home');
  };

  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    return (
      post.content.toLowerCase().includes(q) ||
      post.author.username.toLowerCase().includes(q) ||
      post.author.display_name.toLowerCase().includes(q)
    );
  });

  const handleProfileNavigation = (profile: Profile) => {
    setSelectedProfile(profile);
    setActiveTab('profile');
  };

  const handleMyProfileNavigation = () => {
    if (currentUser) {
      setSelectedProfile(currentUser);
      setActiveTab('profile');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = (newProfile: Profile) => {
    setCurrentUser(newProfile);
    setIsLoggedIn(true);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
    fetchSupabaseData();
  };

  const handleLogout = async () => {
    const supabase = getSupabase() as any;
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    fetchSupabaseData();
  };

  const themeToggler = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="bg-slate-50 text-slate-850 dark:bg-zinc-950 dark:text-zinc-50 min-h-screen transition-colors duration-200">
      
      {/* App wrapper in full layout */}
      <div className="flex max-w-7xl mx-auto items-stretch justify-center relative min-h-screen">
        
        {/* Column 1: Left Menu Navigation Sidebar widget */}
        <Sidebar
          activeTab={activeTab === 'profile' && selectedProfile?.id === currentUser?.id ? 'profile' : activeTab}
          setActiveTab={(tab) => {
            if (tab === 'profile') {
              handleMyProfileNavigation();
            } else {
              setActiveTab(tab);
            }
          }}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onLoginTrigger={() => setShowAuthModal(true)}
          onComposeClick={() => {
            setActiveTab('home');
            setShowMobileCompose(true);
          }}
        />

        {/* Column 2: Central Dynamic Main Feed block */}
        <main className="flex-1 max-w-2xl border-r border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 min-h-screen pb-20 relative">
          <header className="sticky top-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-slate-200 dark:border-zinc-850/80 p-4 font-bold tracking-tight text-lg z-35 flex justify-between items-center sm:px-6">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveTab('home'); setSearchQuery(''); }}>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {activeTab === 'home' && searchQuery ? `Search results for "${searchQuery}"` : activeTab === 'home' ? 'Home Feed' : activeTab === 'profile' ? `${selectedProfile?.display_name}'s SERS` : 'Saved Bookmarks'}
              </span>
              <Sparkles className="w-4 h-4 text-violet-650 dark:text-violet-400 animate-pulse" />
            </div>

            {/* Mobile / Header Specific Theme toggler */}
            <button
              onClick={themeToggler}
              className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 transition cursor-pointer"
              title="Toggle theme aesthetics"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </header>

          {/* Sub-Layout conditional render */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedProfile?.id || '')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="min-h-0"
            >
              {activeTab === 'home' && (
                <>
                  {/* Compositor Box form */}
                  {isLoggedIn && currentUser && (
                    <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 flex gap-3">
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.display_name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-500/10"
                      />
                      <div className="flex-1 space-y-3">
                        <textarea
                          placeholder="What is happening on SERS today? Type and post..."
                          value={composeContent}
                          onChange={(e) => setComposeContent(e.target.value)}
                          maxLength={280}
                          rows={3}
                          className="w-full bg-transparent resize-none text-[15px] leading-relaxed outline-none border-b border-transparent focus:border-slate-100 placeholder:text-slate-400 text-slate-800 dark:text-zinc-100 font-sans"
                        />
                        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl p-1 px-3">
                          <span className={`text-[10px] font-mono font-semibold ${composeContent.length > 250 ? 'text-amber-500 font-extrabold' : 'text-slate-400 dark:text-zinc-550'}`}>
                            {composeContent.length}/280 char limit
                          </span>
                          <button
                            onClick={() => handleCreatePost(composeContent)}
                            disabled={!composeContent.trim() || composeContent.length > 280}
                            className="bg-violet-600 border border-violet-500/10 hover:bg-violet-700 font-bold text-xs text-white px-5 py-2 rounded-full cursor-pointer transition disabled:opacity-45 shadow-sm active:scale-95 flex items-center gap-1 shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isLoggedIn && (
                    <div className="m-4 p-5 rounded-2xl bg-gradient-to-r from-violet-600/5 to-indigo-650/5 border border-violet-550/10 text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-violet-600 dark:text-violet-400 mx-auto" />
                      <div className="space-y-1 px-4">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Guest Access Mode</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                          You are currently viewing SERS microblogs in public read-only mode. Connect an account to compose and comment!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="bg-violet-600 text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-violet-700 transition cursor-pointer"
                      >
                        Sign up or Login here
                      </button>
                    </div>
                  )}

                  {/* Central Feed matching Timeline list */}
                  {filteredPosts.length > 0 ? (
                    <div className="divide-y divide-slate-150 dark:divide-zinc-850 border-t border-slate-100 dark:border-zinc-900/60">
                      {filteredPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          comments={comments.filter((c) => c.post_id === post.id)}
                          currentUser={currentUser}
                          onLike={() => handleLikeToggle(post.id)}
                          onAddComment={handleAddComment}
                          onProfileClick={handleProfileNavigation}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-16 text-center space-y-3">
                      <p className="text-slate-400 dark:text-zinc-500 font-mono text-xs italic">
                        {searchQuery ? 'No matching SERS microblogs found. Try another tag!' : 'Your feed is empty. Be the first to publish a post!'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs font-bold text-violet-605 dark:text-violet-400 hover:underline cursor-pointer"
                        >
                          Clear Active Search Filter
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Account Profile Page layout */}
              {activeTab === 'profile' && selectedProfile && (
                <ProfileView
                  profile={selectedProfile}
                  posts={posts}
                  comments={comments}
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  onLike={handleLikeToggle}
                  onAddComment={handleAddComment}
                  onProfileClick={handleProfileNavigation}
                />
              )}

              {/* Bookmarks view layout */}
              {activeTab === 'bookmarks' && (
                <div className="p-6 text-center space-y-4">
                  <div className="max-w-md mx-auto py-12 rounded-2xl bg-slate-50 dark:bg-zinc-900/30 p-6 border border-slate-150 dark:border-zinc-900/50 space-y-3">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-405 font-mono uppercase tracking-widest block bg-violet-100 dark:bg-violet-950/40 w-fit mx-auto px-2.5 py-1 rounded">
                      Bookmarks Saved
                    </span>
                    <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-base">Your Private Microblog Bookmark Folder</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal px-4">
                      All liked and saved posts are locally bookmarked for immediate review! Reconnect dynamically anytime to review offline replications.
                    </p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="bg-violet-605 text-white font-semibold text-xs px-4 py-2 rounded-full hover:bg-violet-700 cursor-pointer transition shadow-sm inline-block"
                    >
                      Back to chronological feed
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Quick Add icon floating responsive compose button (visible on mobile only) */}
          {isLoggedIn && (
            <button
              onClick={() => setShowMobileCompose(true)}
              className="sm:hidden absolute bottom-5 right-5 w-12 h-12 bg-violet-600 select-none text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-700 shadow-lg shadow-violet-600/30 transition-all z-40"
              title="Compose post mobile"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

        </main>

        {/* Column 3: Discovery & Control Panel widgets */}
        <ControlPanel
          theme={theme}
          toggleTheme={themeToggler}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onHashTagClick={handleHashtagClick}
          onSimulateBotArrival={handleSimulateBotArrival}
          isLoggedIn={isLoggedIn}
          onLoginTrigger={() => setShowAuthModal(true)}
        />

      </div>

      {/* Floating compose panel drawer overlay (Mobile only) */}
      <AnimatePresence>
        {showMobileCompose && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-slate-205 dark:border-zinc-800 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-2">
                <span className="font-extrabold text-sm text-slate-800 dark:text-zinc-150">Create microblog</span>
                <button
                  onClick={() => setShowMobileCompose(false)}
                  className="p-1 rounded-full bg-slate-50 dark:bg-zinc-950 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                placeholder="What is happening on SERS today?"
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                maxLength={280}
                rows={4}
                className="w-full bg-transparent text-sm leading-relaxed outline-none border border-transparent focus:border-slate-100 text-slate-800 dark:text-zinc-100"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-400">
                  {composeContent.length}/280 max characters
                </span>
                <button
                  onClick={() => handleCreatePost(composeContent)}
                  disabled={!composeContent.trim() || composeContent.length > 280}
                  className="bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition disabled:opacity-45"
                >
                  Post SERS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Gate Handler modal popup */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
