import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, CornerDownRight, Check, Send } from 'lucide-react';
import { Post, Comment, Profile } from '../types';
import { motion } from 'motion/react';

interface PostCardProps {
  key?: string | number;
  post: Post;
  comments: Comment[];
  currentUser: Profile | null;
  onLike: () => void;
  onAddComment: (postId: string, content: string) => void;
  onProfileClick: (profile: Profile) => void;
}

export default function PostCard({
  post,
  comments,
  currentUser,
  onLike,
  onAddComment,
  onProfileClick,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);

  const handleLikeClick = () => {
    setIsLikedAnimating(true);
    onLike();
    setTimeout(() => setIsLikedAnimating(false), 500);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    onAddComment(post.id, commentContent.trim());
    setCommentContent('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`Check out this micro-blog by @${post.author.username} on SERS: "${post.content.slice(0, 40)}..."`);
    setShowShareConfirm(true);
    setTimeout(() => setShowShareConfirm(false), 2000);
  };

  // Convert ISO string to beautiful human-readable string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 border-b border-slate-200 dark:border-zinc-850/80 transition-colors">
      <div className="flex gap-3">
        
        {/* User avatar display with profile page link */}
        <button 
          onClick={() => onProfileClick(post.author)}
          className="flex-shrink-0 cursor-pointer focus:outline-none"
        >
          <img
            src={post.author.avatar_url}
            alt={post.author.display_name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-500/5 hover:scale-105 transition duration-200"
          />
        </button>

        {/* Post Content block */}
        <div className="flex-1 space-y-1.5 min-w-0">
          
          {/* Header metadata row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span 
                onClick={() => onProfileClick(post.author)}
                className="font-bold text-sm text-slate-900 dark:text-zinc-100 hover:underline cursor-pointer truncate"
              >
                {post.author.display_name}
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 truncate font-mono">
                @{post.author.username}
              </span>
              <span className="text-[10px] text-slate-350 dark:text-zinc-600 font-bold">•</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                {formatTime(post.created_at)}
              </span>
            </div>
          </div>

          {/* Microblog text */}
          <p className="text-slate-800 dark:text-zinc-100 text-[14px] leading-relaxed break-words whitespace-pre-wrap font-sans">
            {post.content}
          </p>

          {/* Twitter-style interaction toolbar buttons */}
          <div className="flex items-center justify-between pt-2.5 max-w-sm text-slate-400 dark:text-zinc-500">
            {/* 1. Comment button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-xs font-semibold focus:outline-none hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition ${
                showComments ? 'text-violet-600 dark:text-violet-420' : ''
              }`}
            >
              <div className="p-1.5 rounded-full hover:bg-violet-100/10 dark:hover:bg-violet-950/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-mono">{comments.length}</span>
            </button>

            {/* 2. Optimistic Like button */}
            <button
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 text-xs font-semibold focus:outline-none hover:text-red-500 cursor-pointer transition ${
                post.liked_by_me ? 'text-red-500' : ''
              }`}
            >
              <motion.div
                animate={isLikedAnimating ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="p-1.5 rounded-full hover:bg-red-500/10"
              >
                <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-red-500 text-red-500' : ''}`} />
              </motion.div>
              <span className="font-mono">{post.likes_count}</span>
            </button>

            {/* 3. Share copy button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs font-semibold hover:text-emerald-500 focus:outline-none cursor-pointer transition relative"
            >
              <div className="p-1.5 rounded-full hover:bg-emerald-500/10">
                <Share2 className="w-4 h-4" />
              </div>
              {showShareConfirm && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce font-mono">
                  Link Copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Comments drawer */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-850 pl-4 sm:pl-11 space-y-4">
          
          {/* Sub-header label */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 font-mono">
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Replies ({comments.length})</span>
          </div>

          {/* Comment listings */}
          {comments.length > 0 ? (
            <div className="space-y-3 pt-1">
              {comments.map((comm) => (
                <div key={comm.id} className="flex gap-2.5 items-start bg-slate-50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-900/50">
                  <button 
                    onClick={() => onProfileClick(comm.author)}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <img
                      src={comm.author.avatar_url}
                      alt={comm.author.display_name}
                      referrerPolicy="no-referrer"
                      className="w-7.5 h-7.5 rounded-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 justify-between">
                      <div className="flex items-center gap-1 select-none">
                        <span 
                          onClick={() => onProfileClick(comm.author)}
                          className="font-bold text-xs text-slate-900 dark:text-zinc-150 hover:underline cursor-pointer"
                        >
                          {comm.author.display_name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">@{comm.author.username}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        {formatTime(comm.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-zinc-200 text-xs mt-1 leading-relaxed">
                      {comm.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono italic p-3 text-center bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl">
              No replies yet. Be the first to start the conversation!
            </p>
          )}

          {/* Comment composers Form */}
          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Post your reply..."
                value={commentContent}
                maxLength={200}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 outline-none focus:border-violet-600/30 dark:focus:border-violet-500/20"
              />
              <button
                type="submit"
                disabled={!commentContent.trim()}
                className="bg-violet-600 text-white p-2 rounded-xl hover:bg-violet-700 focus:outline-none disabled:opacity-40 cursor-pointer transition flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic p-2 text-center bg-violet-500/5 rounded-xl border border-dashed border-violet-500/10">
              Please sign up or log in to post a reply.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
