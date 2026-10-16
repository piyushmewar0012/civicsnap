import React, { useState } from 'react';
import { X, LogIn, UserPlus, LogOut, Check, AlertCircle, Loader2, ShieldCheck, Mail, Lock, Database } from 'lucide-react';
import { signInUser, signUpUser, signOutUser } from '../services/authService';
import { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChanged: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChanged,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        const { user } = await signUpUser(email.trim(), password);
        setSuccessMessage('Account registered successfully! Session established.');
        onAuthChanged(user);
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        const { user } = await signInUser(email.trim(), password);
        setSuccessMessage('Successfully signed in!');
        onAuthChanged(user);
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      onAuthChanged(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel card-left-purple w-full max-w-md rounded-2xl shadow-glow-purple flex flex-col overflow-hidden border border-purple-500/30">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-purple-500/20 flex items-center justify-between bg-[#0b0e22]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-purple border border-purple-400/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                {currentUser ? 'Your Account' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentUser
                  ? 'Connected to Supabase database'
                  : 'Sign in to save and manage your reports'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-fade p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is already logged in */}
        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200 space-y-1 shadow-inner">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Account Verified</span>
              </div>
              <p className="font-mono text-white text-xs">{currentUser.email}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {currentUser.id}</p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-purple-300 font-mono">
                <Database className="w-3 h-3 text-purple-400" />
                <span>Database Session Active</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Civic issue reports and complaints submitted during this session are automatically linked to your authenticated resident account.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="btn-fade px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="btn-fade inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/30 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <>
            {/* Tabs */}
            <div className="flex border-b border-purple-500/20 bg-[#0d1025]/90 px-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`btn-fade py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  mode === 'signin'
                    ? 'border-purple-400 text-purple-200 font-display'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`btn-fade py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  mode === 'signup'
                    ? 'border-purple-400 text-purple-200 font-display'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Minimum 6 characters</p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-fade px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-fade inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-glow-purple transition-all disabled:opacity-50 border border-purple-400/30"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'signin' ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
