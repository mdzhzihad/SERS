import React, { useState } from 'react';
import { Profile, Post, Comment } from '../types';
import PostCard from './PostCard';
import { Edit2, Sparkles, Check, Image, Users, Heart, MessageSquare } from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  posts: Post[];
  comments: Comment[];
  currentUser: Profile | null;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onProfileClick: (profile: Profile) => void;
}

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
];

export default function ProfileView({
  profile,
  posts,
  comments,
  currentUser,
  onUpdateProfile,
  onLike,
  onAddComment,
  onProfileClick,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar_url);

  // Filter posts exclusively written by this specific user profile
  const userPosts = posts.filter(p => p.profile_id === profile.id);
  
  // Calculate total likes on their posts
  const totalLikesEarned = userPosts.reduce((acc, current) => acc + current.likes_count, 0);

  const isMyProfile = currentUser && currentUser.id === profile.id;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) return;
    
    onUpdateProfile({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, ''),
      bio: bio.trim(),
      avatar_url: selectedAvatar,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Header profile segment */}
      <div className="relative">
        {/* Colorful backdrop gradient */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-violet-600/30 via-violet-600 to-indigo-600/40 rounded-b-xl border-x border-b border-violet-500/10"></div>
        
        {/* Avatar placement overlay */}
        <div className="absolute -bottom-10 left-4 sm:left-6">
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white dark:ring-zinc-950 shadow-md bg-white dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Info bio segment & Edit toggle */}
      <div className="px-4 sm:px-6 pt-4 space-y-4">
        
        {/* Actions bar inline */}
        <div className="flex justify-end pt-1">
          {isMyProfile ? (
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer text-slate-700 dark:text-zinc-200 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer text-slate-500 dark:text-zinc-400 transition"
              >
                Cancel
              </button>
            )
          ) : (
            <span className="text-xs font-mono bg-violet-50 dark:bg-violet-950/30 text-violet-650 dark:text-violet-400 px-3 py-1.5 rounded-full border border-violet-500/10 font-bold">
              Guest Timeline
            </span>
          )}
        </div>

        {/* Edit Form / Details viewer toggle */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
            <h3 className="font-bold text-sm text-violet-600 dark:text-violet-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Modify Connected Profile</span>
            </h3>

            {/* Display Name Input */}
            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-605/50"
              />
            </div>

            {/* Handle/Username Input */}
            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase mb-1">Username Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={15}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-605/50"
                />
              </div>
            </div>

            {/* Bio Input */}
            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase mb-1">Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-605/50 h-20 resize-none"
              />
            </div>

            {/* Avatar Select Pool */}
            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase mb-2">Select SERS Avatar</label>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_POOL.map((imgUrl) => (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setSelectedAvatar(imgUrl)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition duration-150 ${
                      selectedAvatar === imgUrl ? 'border-violet-600 scale-105 shadow-md shadow-violet-600/10' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Avatar selection option" className="w-full h-full object-cover" />
                    {selectedAvatar === imgUrl && (
                      <div className="absolute inset-0 bg-violet-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit save button */}
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2 px-5 rounded-lg cursor-pointer transition flex items-center gap-1 ml-auto"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        ) : (
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold sm:text-2xl text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
              {profile.display_name}
            </h2>
            <p className="font-mono text-xs text-slate-400 dark:text-zinc-500 shrink-0">@{profile.username}</p>
            
            {profile.bio ? (
              <p className="text-slate-700 dark:text-zinc-300 text-sm pt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-slate-400 dark:text-zinc-650 text-sm pt-2 italic">No biography written yet.</p>
            )}
          </div>
        )}

        {/* Dynamic Metric Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2">
          
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900/50 p-2.5 sm:p-3.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-zinc-500 mb-0.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider font-mono">POSTS</span>
            </div>
            <p className="font-mono text-lg sm:text-xl font-black text-slate-800 dark:text-zinc-100">
              {userPosts.length}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900/50 p-2.5 sm:p-3.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-zinc-500 mb-0.5">
              <Heart className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider font-mono">LIKES</span>
            </div>
            <p className="font-mono text-lg sm:text-xl font-black text-slate-850 dark:text-zinc-100">
              {totalLikesEarned}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900/50 p-2.5 sm:p-3.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-zinc-500 mb-0.5">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider font-mono">AUDIENCE</span>
            </div>
            <p className="font-mono text-lg sm:text-xl font-black text-slate-805 dark:text-zinc-100">
              2.4K
            </p>
          </div>

        </div>

      </div>

      {/* User Timeline List Stream */}
      <div className="border-t border-slate-200 dark:border-zinc-800 mt-6 divide-y divide-slate-200 dark:divide-zinc-800">
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 sticky top-[57px] backdrop-blur-md z-10 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-zinc-400 uppercase tracking-widest font-mono">
            TIMELINE ({userPosts.length} post{userPosts.length !== 1 ? 's' : ''})
          </span>
        </div>

        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={comments.filter(c => c.post_id === post.id)}
              currentUser={currentUser}
              onLike={() => onLike(post.id)}
              onAddComment={onAddComment}
              onProfileClick={onProfileClick}
            />
          ))
        ) : (
          <div className="p-10 font-mono text-xs text-center text-slate-400 italic">
            This workspace timeline has no microblogs posted yet.
          </div>
        )}
      </div>

    </div>
  );
}
