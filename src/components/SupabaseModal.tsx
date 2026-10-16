import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, Copy, ExternalLink, Terminal, Shield, RefreshCw } from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

const SQL_SCHEMA_TEXT = `-- CivicLens Supabase Setup Script
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT,
    user_email TEXT,
    tracking_id TEXT,
    ai_provider TEXT,
    photo_url TEXT,
    photo_name TEXT,
    location_provided TEXT NOT NULL,
    detected_category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    confidence_note TEXT,
    photo_clarity TEXT NOT NULL,
    is_insufficient_evidence BOOLEAN DEFAULT false,
    visible_observations JSONB DEFAULT '[]'::jsonb,
    uncertain_details JSONB DEFAULT '[]'::jsonb,
    draft_subject TEXT,
    draft_body TEXT,
    draft_closing TEXT,
    full_draft_text TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_progress', 'resolved')),
    user_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.civic_users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'citizen',
    auth_provider TEXT DEFAULT 'supabase_database'
);

CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON public.civic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON public.civic_reports(detected_category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_tracking_id ON public.civic_reports(tracking_id);
CREATE INDEX IF NOT EXISTS idx_civic_users_email ON public.civic_users(email);

ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view civic reports" ON public.civic_reports;
CREATE POLICY "Public can view civic reports" ON public.civic_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert civic reports" ON public.civic_reports;
CREATE POLICY "Public can insert civic reports" ON public.civic_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update civic reports" ON public.civic_reports;
CREATE POLICY "Public can update civic reports" ON public.civic_reports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete civic reports" ON public.civic_reports;
CREATE POLICY "Public can delete civic reports" ON public.civic_reports FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public can view civic_users" ON public.civic_users;
CREATE POLICY "Public can view civic_users" ON public.civic_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert civic_users" ON public.civic_users;
CREATE POLICY "Public can insert civic_users" ON public.civic_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update civic_users" ON public.civic_users;
CREATE POLICY "Public can update civic_users" ON public.civic_users FOR UPDATE USING (true);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('civic-photos', 'civic-photos', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view civic photos" ON storage.objects;
CREATE POLICY "Public can view civic photos" ON storage.objects FOR SELECT USING (bucket_id = 'civic-photos');

DROP POLICY IF EXISTS "Public can upload civic photos" ON storage.objects;
CREATE POLICY "Public can upload civic photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'civic-photos');
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    onConfigChanged();
    setTestResult(null);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConfigChanged();
  };

  const handleTestConnection = async () => {
    // If user edited fields, temporarily save to test
    saveSupabaseConfig(url, anonKey);
    onConfigChanged();
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supabase Backend Setup</h2>
              <p className="text-[11px] text-slate-500">
                PostgreSQL database & storage for persistent civic reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Schema & Tables</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'credentials' ? (
            <>
              {currentConfig.source === 'env' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Configured via <strong>.env</strong> file variables (<code className="bg-blue-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code>). You can also override them below.
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Supabase Anon / Public Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
                  </p>
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !url.trim() || !anonKey.trim()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test Supabase Connection'}</span>
                </button>

                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* 3 Step Setup Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Quick Setup (3 Steps):</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 underline font-normal"
                  >
                    Open Supabase Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Create a new project on Supabase.</li>
                  <li>Copy the Project URL & anon key into the fields above.</li>
                  <li>Switch to the <strong>SQL Schema</strong> tab and run the script in Supabase's SQL Editor.</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Paste this into your <strong>Supabase Dashboard → SQL Editor</strong> and hit <strong>Run</strong>:
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-xl max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                {SQL_SCHEMA_TEXT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium"
          >
            Clear Credentials
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
