import React, { useEffect, useState } from 'react';
import {
  CivicReportRecord,
  ReportStatus,
} from '../types/civic';
import {
  fetchCivicReports,
  deleteCivicReport,
  updateReportStatus,
  getLocalReports,
  getIsSupabaseTableMissing,
} from '../services/reportService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Database,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  MapPin,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  User,
  Layers,
  Tag,
} from 'lucide-react';

interface ReportsFeedProps {
  onOpenSupabaseModal?: () => void;
  currentUser: SupabaseUser | null;
  onOpenAuth: () => void;
  onSelectForEdit?: (report: CivicReportRecord) => void;
}

export const ReportsFeed: React.FC<ReportsFeedProps> = ({
  onOpenSupabaseModal,
  currentUser,
  onOpenAuth,
}) => {
  const [reports, setReports] = useState<CivicReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userScopeFilter, setUserScopeFilter] = useState<'all' | 'mine'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchCivicReports();
      setReports(data);
      setIsTableMissing(getIsSupabaseTableMissing());
    } catch (err: any) {
      console.warn('Error fetching reports from Supabase, using local:', err);
      const local = getLocalReports();
      setReports(local);
      setIsTableMissing(getIsSupabaseTableMissing());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCopyDraft = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy draft: ', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this report?')) {
      return;
    }
    try {
      await deleteCivicReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    try {
      await updateReportStatus(id, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert('Status update error: ' + err.message);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesCategory =
      categoryFilter === 'all' || r.detected_category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' || r.status === statusFilter;
    const matchesUser =
      userScopeFilter === 'all' || (currentUser && r.user_id === currentUser.id);
    return matchesCategory && matchesStatus && matchesUser;
  });

  const configured = isSupabaseConfigured();

  if (!configured && reports.length === 0) {
    return (
      <div className="glass-panel card-left-indigo rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-glow-purple space-y-4 backdrop-blur-xl">
        <div className="w-14 h-14 bg-gradient-to-tr from-purple-900/50 to-blue-900/50 text-purple-300 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30 shadow-glow-purple">
          <Database className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold font-display text-white">
          No Reports Stored Yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Submit a complaint in the New Report tab. You can also connect your Supabase database to synchronize reports across devices.
        </p>
        {onOpenSupabaseModal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="btn-fade inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-glow-purple"
            >
              <Database className="w-4 h-4" />
              <span>Configure Supabase</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Table Missing Alert Banner */}
      {isTableMissing && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                Supabase Table Missing — Local Offline Mode Active
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                The <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-200 font-mono">civic_reports</code> table was not found in your Supabase database. Your complaint is safely stored on your device and displayed below. Run the SQL script in your Supabase SQL Editor to enable cloud sync.
              </p>
            </div>
          </div>
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="btn-fade px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs shrink-0 inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>View SQL Script</span>
            </button>
          )}
        </div>
      )}
      {/* Top Controls */}
      <div className="glass-panel card-left-blue rounded-2xl p-5 shadow-glow-blue backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Recent Reports Feed</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage all citizen complaints stored in the database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadReports}
            disabled={isLoading}
            className="btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#141830] hover:bg-[#1c2246] text-slate-300 border border-purple-500/25 transition-all disabled:opacity-50"
            title="Refresh database feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-[#0b0e20]/80 p-3.5 rounded-xl border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
          <span>Filter:</span>
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#121630] border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
        >
          <option value="all">All Categories</option>
          <option value="pothole">Potholes</option>
          <option value="garbage_accumulation">Garbage</option>
          <option value="broken_streetlight">Streetlights</option>
          <option value="unclear_insufficient">Unclear</option>
          <option value="unsupported_category">Out-of-Scope</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#121630] border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* User Scope Filter */}
        {currentUser ? (
          <div className="flex items-center gap-1 bg-[#121630] p-0.5 rounded-lg border border-purple-500/30">
            <button
              type="button"
              onClick={() => setUserScopeFilter('all')}
              className={`btn-fade px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                userScopeFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Reports
            </button>
            <button
              type="button"
              onClick={() => setUserScopeFilter('mine')}
              className={`btn-fade px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                userScopeFilter === 'mine'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Reports
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="btn-fade text-[11px] text-purple-400 hover:text-purple-300 underline font-mono"
          >
            Sign in to filter your reports
          </button>
        )}

        {(categoryFilter !== 'all' || statusFilter !== 'all' || userScopeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setStatusFilter('all');
              setUserScopeFilter('all');
            }}
            className="btn-fade text-[11px] text-purple-400 hover:underline ml-auto font-mono"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong>Query Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Report List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
          <span className="font-mono">Loading reports from database...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel card-left-indigo rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2 backdrop-blur-xl">
          <p className="font-semibold text-white text-sm font-display">No reports found</p>
          <p className="text-slate-400">
            {userScopeFilter === 'mine'
              ? 'No reports submitted by your account yet.'
              : 'Create a report in the New Report tab and click "Submit Complaint".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((item) => (
            <div
              key={item.id}
              className="glass-panel card-left-purple rounded-2xl p-5 shadow-glow-purple backdrop-blur-xl hover:border-purple-400/40 transition-all space-y-3.5"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/15">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono">
                    {item.category_label || item.detected_category}
                  </span>

                  {/* Tracking ID Badge */}
                  {item.tracking_id && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-semibold shadow-xs">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>{item.tracking_id}</span>
                    </span>
                  )}

                  {/* Status Dropdown */}
                  <div className="relative inline-block text-xs">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as ReportStatus)
                      }
                      className={`text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${
                        item.status === 'resolved'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : item.status === 'in_progress'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                          : item.status === 'submitted'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Author / User Badge */}
                  {item.user_email ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        currentUser && item.user_id === currentUser.id
                          ? 'bg-purple-950/70 text-purple-200 border border-purple-500/40 font-semibold'
                          : 'bg-[#141830] text-slate-400 border border-purple-500/15'
                      }`}
                      title={`Submitted by ${item.user_email}`}
                    >
                      <User className="w-3 h-3 text-purple-400" />
                      <span>{currentUser && item.user_id === currentUser.id ? 'You' : item.user_email.split('@')[0]}</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="btn-fade p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main content grid */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Photo thumbnail */}
                {item.photo_url && (
                  <div className="w-full sm:w-36 h-28 sm:h-28 rounded-xl overflow-hidden bg-black/70 border border-purple-500/25 shrink-0 shadow-inner">
                    <img
                      src={item.photo_url}
                      alt={item.photo_name || 'Civic evidence capture'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-100 font-semibold font-display">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{item.location_provided}</span>
                  </div>

                  {/* Observations preview */}
                  {item.visible_observations && item.visible_observations.length > 0 && (
                    <div className="text-slate-300 line-clamp-2">
                      <strong className="text-purple-300">Observations:</strong>{' '}
                      {item.visible_observations.join(' • ')}
                    </div>
                  )}

                  {/* Subject */}
                  {item.draft_subject && (
                    <div className="text-slate-300">
                      <strong className="text-slate-100">Subject:</strong> {item.draft_subject}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Draft Text */}
              <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDraftId(
                      expandedDraftId === item.id ? null : item.id
                    )
                  }
                  className="btn-fade inline-flex items-center gap-1 text-purple-300 hover:text-white font-medium"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      expandedDraftId === item.id ? 'rotate-180' : ''
                    }`}
                  />
                  <span>
                    {expandedDraftId === item.id
                      ? 'Hide Draft'
                      : 'View Full Draft'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyDraft(item.id, item.full_draft_text)
                  }
                  className="btn-fade inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold bg-[#171b35] hover:bg-[#20264b] text-slate-200 border border-purple-500/30 transition-all"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-purple-400" />
                  )}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy Draft'}</span>
                </button>
              </div>

              {/* Expanded Draft content */}
              {expandedDraftId === item.id && (
                <div className="pt-2">
                  <pre className="p-4 bg-[#090b17] border border-purple-500/25 rounded-xl text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto selection:bg-purple-600/40">
                    {item.full_draft_text}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
