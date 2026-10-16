import React from 'react';
import { X, CheckCircle2, AlertOctagon, FileText, Sparkles } from 'lucide-react';

interface PRDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRDModal: React.FC<PRDModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel card-left-indigo w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-glow-purple flex flex-col overflow-hidden border border-purple-500/30">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-purple-500/20 flex items-center justify-between bg-[#0b0e22]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-purple border border-purple-400/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Product Scope & Guidelines
              </h2>
              <p className="text-xs text-slate-400">Civic complaint drafting principles & scope</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-fade p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Core Principle */}
          <div className="glass-panel card-left-purple rounded-xl p-4 bg-purple-950/30 border border-purple-500/30">
            <h3 className="font-bold font-display text-white text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Core Principle</span>
            </h3>
            <p className="text-purple-200">
              CivicSnap focuses on <strong className="text-white">evidence-grounded drafting</strong>. It creates objective, polite complaint drafts based directly on visible photo evidence without exaggerating severity, guessing unseen causes, or asserting unsupported measurements.
            </p>
          </div>

          {/* 3 Categories */}
          <div>
            <h3 className="font-bold font-display text-white text-sm mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Supported Issue Categories</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#0e1227] rounded-xl border border-purple-500/20 card-left-purple">
                <span className="font-semibold text-white font-display block">1. Potholes & Road Damage</span>
                <span className="text-xs text-slate-400">Pavement depression, asphalt fractures, road surface damage.</span>
              </div>
              <div className="p-3.5 bg-[#0e1227] rounded-xl border border-purple-500/20 card-left-blue">
                <span className="font-semibold text-white font-display block">2. Garbage Accumulation</span>
                <span className="text-xs text-slate-400">Uncollected solid waste, discarded packaging, litter piles on walkways.</span>
              </div>
              <div className="p-3.5 bg-[#0e1227] rounded-xl border border-purple-500/20 card-left-indigo">
                <span className="font-semibold text-white font-display block">3. Broken Streetlights</span>
                <span className="text-xs text-slate-400">Damaged light fixtures, tilted posts, or visibly broken lamp covers.</span>
              </div>
            </div>
          </div>

          {/* Out of Scope */}
          <div className="glass-panel card-left-amber rounded-xl p-4 bg-amber-950/20 border border-amber-500/20">
            <h3 className="font-bold font-display text-amber-300 text-sm mb-2 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Guidelines & Limitations</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Does not guess pothole depth or dimensions</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Does not speculate on electrical or structural causes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Marks unclear or low-light images as unverified</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Allows full manual review and editing before submission</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0b0e22]/90 border-t border-purple-500/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-fade px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all shadow-glow-purple border border-purple-400/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

