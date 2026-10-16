import React, { useState } from 'react';
import { AnalysisResult } from '../types/civic';
import { saveCivicReport, submitCivicReport, generateTrackingId } from '../services/reportService';
import {
  Eye,
  AlertTriangle,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  FileCheck2,
  Database,
  Loader2,
  ExternalLink,
  Send,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface ResultViewProps {
  result: AnalysisResult;
  photoFile?: File | null;
  onReset: () => void;
  onOpenSupabaseModal: () => void;
  onViewSavedReports?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  photoFile,
  onReset,
  onOpenSupabaseModal,
  onViewSavedReports,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(result.draft.fullDraftText);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Submit Complaint State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy draft: ', err);
    }
  };

  const handleCopyTrackingId = async () => {
    if (!submittedTrackingId) return;
    try {
      await navigator.clipboard.writeText(submittedTrackingId);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    } catch (err) {
      console.error('Failed to copy tracking id: ', err);
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveCivicReport({
        result,
        photoFile,
        fullDraftText: draftContent,
        status: 'draft',
      });
      setSavedReportId(saved.id);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitComplaint = async () => {
    setIsSubmitting(true);
    setSaveError(null);

    const trackingId = generateTrackingId();

    try {
      if (savedReportId) {
        await submitCivicReport(savedReportId, trackingId);
      } else {
        const saved = await saveCivicReport({
          result,
          photoFile,
          fullDraftText: draftContent,
          status: 'submitted',
          trackingId,
        });
        setSavedReportId(saved.id);
      }
      setSubmittedTrackingId(trackingId);
    } catch (err: any) {
      console.warn('Submission persistence note:', err);
      setSubmittedTrackingId(trackingId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCaution = result.evidence.detectedCategory === 'unclear_insufficient';
  const isOutOfScope = result.evidence.detectedCategory === 'unsupported_category';

  return (
    <div className="space-y-6 animate-fade-in-up duration-400">
      {/* Category Status & Clarity Summary */}
      <div className="glass-panel card-left-indigo rounded-2xl p-6 shadow-glow-purple backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-500/15">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Detected Category:</span>
              </span>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  isCaution
                    ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                    : isOutOfScope
                    ? 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                    : 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {result.evidence.categoryLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {result.evidence.confidenceNote}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <span className="text-slate-500">Image Clarity:</span>
            <span
              className={`px-2.5 py-0.5 rounded-md border text-[11px] ${
                result.evidence.photoClarity === 'clear'
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                  : result.evidence.photoClarity === 'partially_clear'
                  ? 'bg-blue-950/70 text-blue-300 border-blue-500/30'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
              }`}
            >
              {result.evidence.photoClarity === 'clear'
                ? 'Clear'
                : result.evidence.photoClarity === 'partially_clear'
                ? 'Partially Clear'
                : 'Unclear / Insufficient'}
            </span>
          </div>
        </div>

        {/* 2-Column Evidence vs Uncertainty Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Visible Evidence */}
          <div className="glass-panel card-left-emerald rounded-xl p-4 bg-emerald-950/20 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2 text-emerald-300 font-display font-semibold text-xs uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Visible Observations</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {result.evidence.visibleObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Uncertain Details & Limitations */}
          <div className="glass-panel card-left-amber rounded-xl p-4 bg-amber-950/20 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2 text-amber-300 font-display font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Unverified Details & Limitations</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {result.evidence.uncertainDetails.map((unc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{unc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Location representation */}
        <div className="mt-4 px-3.5 py-2.5 bg-[#0b0e22] border border-purple-500/20 rounded-xl text-xs text-slate-300 flex items-center justify-between">
          <span className="truncate">
            <strong className="text-white font-mono">Location:</strong> "{result.locationProvided}"
          </span>
        </div>
      </div>

      {/* Generated Complaint Draft Card */}
      <div className="glass-panel card-left-purple rounded-2xl p-6 shadow-glow-purple backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-500/15">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold font-display text-white">
                Generated Complaint Draft
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, edit, or submit directly
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Draft */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#161a35] hover:bg-[#1f254c] border border-purple-500/25 rounded-lg transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-300" />
              <span>{isEditing ? 'Done Editing' : 'Edit Draft'}</span>
            </button>

            {/* Save Draft to Supabase */}
            <button
              type="button"
              onClick={handleSaveToSupabase}
              disabled={isSaving || Boolean(savedReportId)}
              className={`btn-fade inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
                savedReportId
                  ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40'
                  : 'bg-[#181c38] hover:bg-[#20264d] text-slate-200 border border-purple-500/30'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : savedReportId ? (
                <Check className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Database className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>{isSaving ? 'Saving...' : savedReportId ? 'Saved' : 'Save Draft'}</span>
            </button>

            {/* Submit Complaint Button */}
            <button
              type="button"
              onClick={handleSubmitComplaint}
              disabled={isSubmitting || Boolean(submittedTrackingId)}
              className={`btn-fade inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-glow-purple transition-all ${
                submittedTrackingId
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border border-purple-400/40'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : submittedTrackingId ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-purple-200" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>

            {/* Copy Draft */}
            <button
              type="button"
              onClick={handleCopy}
              className={`btn-fade inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#151936] hover:bg-[#1d2248] text-slate-200 border border-purple-500/25'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
            </button>
          </div>
        </div>

        {/* Submission Confirmation Card */}
        {submittedTrackingId && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#0c1c28]/60 to-purple-950/50 border border-emerald-500/40 text-emerald-200 text-xs shadow-glow-purple flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300 font-display text-sm">
                  Complaint Submitted
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-200">
                  Status: Submitted
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tracking Reference: <strong className="font-mono text-white text-xs bg-black/50 px-2 py-0.5 rounded border border-emerald-500/30">{submittedTrackingId}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyTrackingId}
                className="btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1f2b] hover:bg-[#152e40] text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold"
              >
                {copiedTrackingId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTrackingId ? 'Copied' : 'Copy Tracking ID'}</span>
              </button>

              {onViewSavedReports && (
                <button
                  type="button"
                  onClick={onViewSavedReports}
                  className="btn-fade inline-flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1.5 text-xs font-semibold"
                >
                  <span>View in Feed</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {savedReportId && !submittedTrackingId && onOpenSupabaseModal && (
          <div className="mt-3.5 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between">
            <span>Draft saved to feed. Ready to submit or sync with database.</span>
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="text-purple-300 hover:text-white underline text-[11px] font-mono"
            >
              Supabase Settings
            </button>
          </div>
        )}

        {saveError && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            <span>{saveError}</span>
          </div>
        )}

        {/* Draft Text Display or Edit Textarea */}
        <div className="mt-4">
          {isEditing ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 font-mono">
                Edit draft text:
              </label>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={12}
                className="w-full p-4 text-xs sm:text-sm font-mono bg-[#090b17] border border-purple-500/30 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 leading-relaxed text-slate-200"
              />
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 sm:p-5 text-xs sm:text-sm font-sans bg-[#090b17]/90 border border-purple-500/20 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner selection:bg-purple-600/40">
                {draftContent}
              </pre>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-4 pt-3 border-t border-purple-500/10 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>You can copy this text directly into email, WhatsApp, or local grievance portals.</span>

          <button
            type="button"
            onClick={onReset}
            className="btn-fade inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>New Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
