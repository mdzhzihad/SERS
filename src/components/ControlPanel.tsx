import React from 'react';
import { Search, Flame, Settings, Moon, Sun, ShieldCheck, HelpCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import { mockTrending } from '../data/mockData';
import { Post } from '../types';

interface ControlPanelProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onHashTagClick: (tag: string) => void;
  onSimulateBotArrival: () => void;
  isLoggedIn: boolean;
  onLoginTrigger: () => void;
}

export default function ControlPanel({
  theme,
  toggleTheme,
  searchQuery,
  onSearchChange,
  onHashTagClick,
  onSimulateBotArrival,
  isLoggedIn,
  onLoginTrigger,
}: ControlPanelProps) {
  return (
    <aside className="w-80 hidden lg:flex flex-col gap-5 p-4 sticky top-0 h-screen overflow-y-auto border-l border-slate-200 dark:border-zinc-805 bg-white dark:bg-zinc-950">
      
      {/* Search Input Box */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition" />
        <input
          type="text"
          placeholder="Search SERS microblogs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-xs outline-none focus:border-violet-600/40 dark:focus:border-violet-500/20 text-slate-800 dark:text-zinc-100 transition-all font-sans"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 dark:bg-zinc-800 hover:bg-slate-350 px-1.5 py-0.5 rounded text-slate-500 cursor-pointer font-bold font-mono transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Modern Theme Switcher */}
      <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wide flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" />
            <span>Display Settings</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Comfort Theme</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Currently: {theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 hover:border-violet-500 text-slate-650 dark:text-zinc-350 cursor-pointer transition active:scale-95 shadow-sm"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-violet-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Trending / SERS Spark topics */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-900/50 space-y-3 bg-white dark:bg-zinc-950 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 font-mono tracking-wider flex items-center gap-1.5 uppercase pb-1 border-b border-slate-150 dark:border-zinc-850">
          <Flame className="w-3.5 h-3.5 text-violet-500" />
          <span>Trending Hashtags</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-zinc-900">
          {mockTrending.map((trend) => (
            <div 
              key={trend.topic}
              onClick={() => onHashTagClick(trend.topic)}
              className="py-2.5 text-left group cursor-pointer hover:opacity-85"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                  {trend.category}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8px] bg-red-50 dark:bg-red-950 text-red-650 dark:text-red-400 px-1 py-0.5 rounded uppercase font-extrabold font-mono font-bold tracking-wider">
                  HOT
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition font-mono mt-0.5">
                #{trend.topic}
              </p>
              <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.2">
                {trend.posts} SERS microblogs
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini info footer */}
      <div className="px-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Security Verified</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-550 text-left select-none">
          SERS Social Hub &copy; 2026. Made with love for premium interactions.
        </p>
      </div>

    </aside>
  );
}
