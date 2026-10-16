import React from 'react';
import {
  Camera,
  Key,
  Layers,
  Sparkles,
  User,
  UserCheck,
  Cpu,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AIProvider } from '../types/civic';

interface HeaderProps {
  onOpenPRD: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
  onOpenOpenSourceAi: () => void;
  aiProvider: AIProvider;
  activeTab: 'assess' | 'reports';
  onTabChange: (tab: 'assess' | 'reports') => void;
  currentUser: SupabaseUser | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKey,
  hasApiKey,
  onOpenOpenSourceAi,
  aiProvider,
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#090b17]/85 border-b border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-glow-purple border border-purple-400/30">
            <Camera className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-white via-purple-100 to-indigo-300 bg-clip-text text-transparent">
                CivicSnap
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI-assisted civic issue documentation
            </p>
          </div>
        </div>

        {/* Center / Navigation Tabs */}
        <div className="flex items-center bg-[#13162b]/80 p-1 rounded-xl border border-purple-500/20 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange('assess')}
            className={`btn-fade inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'assess'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-purple-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>New Report</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`btn-fade inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-blue-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>Reports Feed</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Open Source AI Config Button */}
          <button
            onClick={onOpenOpenSourceAi}
            type="button"
            className={`btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              aiProvider === 'opensource'
                ? 'bg-purple-950/80 text-purple-200 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-[#14182f] text-slate-400 border-purple-500/20 hover:bg-[#1a2040]'
            }`}
            title="Configure Open Source AI (Ollama / LLaMA 3.2 Vision)"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Open Source AI</span>
          </button>

          {/* Gemini API Key Button */}
          <button
            onClick={onOpenApiKey}
            type="button"
            className={`btn-fade inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              hasApiKey
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/60 shadow-xs'
                : 'bg-[#14182f] text-slate-400 border-purple-500/20 hover:bg-[#1a2040]'
            }`}
            title="Configure Gemini Cloud Vision Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">{hasApiKey ? 'Gemini Active' : 'Gemini Key'}</span>
          </button>

          {/* User Auth Button / Account Badge */}
          <button
            onClick={onOpenAuth}
            type="button"
            className={`btn-fade inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              currentUser
                ? 'bg-purple-950/80 text-purple-200 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-purple-900/80'
                : 'bg-[#14182f] text-slate-300 border-purple-500/20 hover:bg-[#1a2040]'
            }`}
            title={currentUser ? `Logged in as ${currentUser.email} - Click to manage account or sign out` : 'Sign in with your account'}
          >
            {currentUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-purple-100 font-bold max-w-[110px] sm:max-w-[140px] truncate">
                  {currentUser.email ? currentUser.email.split('@')[0] : 'Resident'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
