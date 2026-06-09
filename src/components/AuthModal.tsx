import React, { useState } from 'react';
import { Mail, Lock, Feather, X, ArrowRight, AlertCircle } from 'lucide-react';
import { Profile } from '../types';
import { getSupabase } from '../lib/supabaseClient';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      // Local offline simulation mode
      try {
        const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
        if (isSignUp) {
          if (formattedUsername.length < 3) {
            throw new Error("Username handle must be at least 3 characters long.");
          }
          const localUsersRaw = localStorage.getItem('sers_local_users') || '[]';
          const localUsers = JSON.parse(localUsersRaw);
          if (localUsers.some((u: any) => u.username === formattedUsername)) {
            throw new Error("This username handle is already taken.");
          }
          if (localUsers.some((u: any) => u.email === email.trim().toLowerCase())) {
            throw new Error("This email address is already registered.");
          }

          const newUser = {
            id: 'local_user_' + Math.random().toString(36).slice(2, 9),
            email: email.trim().toLowerCase(),
            password,
            username: formattedUsername,
            display_name: displayName.trim() || formattedUsername,
            avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${formattedUsername}`,
            bio: 'SERS designer onboarded offline.',
            created_at: new Date().toISOString()
          };

          localUsers.push(newUser);
          localStorage.setItem('sers_local_users', JSON.stringify(localUsers));

          const userProfile: Profile = {
            id: newUser.id,
            username: newUser.username,
            display_name: newUser.display_name,
            avatar_url: newUser.avatar_url,
            bio: newUser.bio,
            created_at: newUser.created_at
          };

          onSuccess(userProfile);
          onClose();
        } else {
          const localUsersRaw = localStorage.getItem('sers_local_users') || '[]';
          const localUsers = JSON.parse(localUsersRaw);
          const found = localUsers.find(
            (u: any) =>
              u.email === email.trim().toLowerCase() && u.password === password
          );

          if (!found) {
            throw new Error("Invalid credentials or user does not exist locally. Register an account first!");
          }

          const userProfile: Profile = {
            id: found.id,
            username: found.username,
            display_name: found.display_name,
            avatar_url: found.avatar_url,
            bio: found.bio,
            created_at: found.created_at
          };

          onSuccess(userProfile);
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Local auth failed.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up with password
        const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
        if (formattedUsername.length < 3) {
          throw new Error("Username handle must be at least 3 characters long.");
        }

        // Proactively check if the username is already taken in the Supabase database
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formattedUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error("This username handle is already taken. Please choose another.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: formattedUsername,
              display_name: displayName.trim() || formattedUsername,
              avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${formattedUsername}`
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // If auto-logged in or confirmation disabled:
          if (data.session) {
            const userProfile: Profile = {
              id: data.user.id,
              username: formattedUsername,
              display_name: displayName.trim() || formattedUsername,
              avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${formattedUsername}`,
              bio: 'Web developer onboarded onto SERS.',
              created_at: data.user.created_at
            };
            onSuccess(userProfile);
            onClose();
          } else {
            setConfirmationNeeded(true);
          }
        }
      } else {
        // Log in with password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Get profile detail row
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const row = profileRow as any;

          const userProfile: Profile = {
            id: data.user.id,
            username: row?.username || data.user.user_metadata?.username || data.user.email!.split('@')[0],
            display_name: row?.display_name || data.user.user_metadata?.display_name || data.user.email!.split('@')[0],
            avatar_url: row?.avatar_url || data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.user.id}`,
            bio: row?.bio || 'Just joined SERS!',
            created_at: data.user.created_at
          };

          onSuccess(userProfile);
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Auth process failed:", err);
      setErrorMsg(err.message || "An authentication schema error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer transition p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center space-y-5">
          {/* SERS Logo */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/30 font-bold">
              <Feather className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-black mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {isSignUp ? 'Create your Account' : 'Sign in to SERS'}
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 text-left flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-750 dark:text-red-350 leading-relaxed font-semibold">
                {errorMsg}
              </p>
            </div>
          )}

          {!confirmationNeeded ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Type Switcher Tab */}
              <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
                  className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg cursor-pointer transition ${
                    !isSignUp
                      ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
                  className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg cursor-pointer transition ${
                    isSignUp
                      ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Dynamic sign-up fields row */}
              {isSignUp && (
                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-150">
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase mb-0.5">Display Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-2.5 py-2 text-xs outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-600/30"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Zack Torres"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase mb-0.5">Username Handle</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-2.5 py-2 text-xs outline-none text-slate-800 dark:text-zinc-100 font-mono focus:border-violet-600/30"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. zack_owl"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@example.com"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-500/50 font-mono"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder={isSignUp ? "At least 6 characters" : "Enter password"}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none text-slate-800 dark:text-zinc-100 focus:border-violet-500/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Trigger Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold p-3 rounded-xl transition duration-150 cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 text-xs text-center disabled:opacity-50 font-sans"
              >
                <span>
                  {isSubmitting
                    ? 'Processing connection...'
                    : isSignUp
                    ? 'Create SERS Account'
                    : 'Log In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Toggler sign up / in */}
              <div className="text-center pt-1.5">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                  className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Already have a profile? Sign In' : 'New to SERS? Create an account instantly'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <Mail className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-base text-slate-800 dark:text-zinc-100">Verification Link Sent</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 px-2 leading-relaxed">
                  Your account creation request was sent! Please check your inbox at <strong className="text-violet-650 dark:text-violet-400">{email}</strong> to verify your email.
                </p>
                <div className="bg-amber-500/5 border border-dashed border-amber-500/10 p-2.5 rounded-xl text-left text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                  If you have Email Confirmation disabled in your Supabase Auth settings, you can login immediately.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
