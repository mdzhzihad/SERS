import React from 'react';
import { Feather, Home, User, Bookmark, FileCode2, LogOut, LogIn, Sparkles } from 'lucide-react';
import { Profile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: Profile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onLoginTrigger: () => void;
  onComposeClick: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  isLoggedIn,
  onLogout,
  onLoginTrigger,
  onComposeClick,
}: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-5.5 h-5.5" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-5.5 h-5.5" />, requiresAuth: true },
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-5.5 h-5.5" />, requiresAuth: true },
    { id: 'dev-console', label: 'Next.js Console', icon: <FileCode2 className="w-5.5 h-5.5" /> },
  ];

  return (
    <aside className="w-16 sm:w-64 flex flex-col justify-between h-screen sticky top-0 px-2 sm:px-4 py-4 border-r border-slate-200 dark:border-zinc-805 bg-white dark:bg-zinc-950 z-20">
      
      {/* Upper Navigation block */}
      <div className="space-y-6">
        
        {/* Brand Logo Header */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:opacity-90 select-none group"
        >
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-600/20 group-hover:scale-105 transition-all">
            <Feather className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent hidden sm:block">
            SERS
          </span>
          <span className="hidden sm:inline-flex bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[9px] font-mono font-extrabold px-1 py-0.5 rounded uppercase">
            Beta
          </span>
        </div>

        {/* Menu Items Link list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            if (item.requiresAuth && !isLoggedIn) return null;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 shadow-sm border-l-4 border-violet-600'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-50'
                }`}
              >
                <span className={`${isActive ? 'scale-105 text-violet-600 dark:text-violet-405' : ''}`}>
                  {item.icon}
                </span>
                <span className="hidden sm:block text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Post overlay trigger */}
        {isLoggedIn ? (
          <button
            onClick={onComposeClick}
            className="w-full bg-violet-600 text-white font-bold p-3 rounded-full flex items-center justify-center gap-2 hover:bg-violet-700 active:scale-[0.98] shadow-md shadow-violet-600/10 cursor-pointer transition hidden sm:flex"
          >
            <Sparkles className="w-4 h-4" />
            <span>Compose Post</span>
          </button>
        ) : (
          <button
            onClick={onLoginTrigger}
            className="w-full bg-violet-600 text-white font-bold p-3 rounded-full flex items-center justify-center gap-2 hover:bg-violet-700 active:scale-[0.98] shadow-md shadow-violet-600/10 cursor-pointer transition hidden sm:flex"
          >
            <LogIn className="w-4 h-4" />
            <span>Simulate Auth</span>
          </button>
        )}
      </div>

      {/* User Session Badge Controller */}
      <div className="border-t border-slate-100 dark:border-zinc-900 pt-4 mt-auto">
        {isLoggedIn && currentUser ? (
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/40">
            {/* Avatar info with direct Profile view hook */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 cursor-pointer max-w-[80%]"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.display_name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border-2 border-violet-500/10"
              />
              <div className="hidden sm:block text-left truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{currentUser.display_name}</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono truncate">@{currentUser.username}</p>
              </div>
            </div>
            {/* Log out simulation */}
            <button
              onClick={onLogout}
              title="Logout session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginTrigger}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 cursor-pointer transition"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Account</span>
          </button>
        )}
      </div>

    </aside>
  );
}
