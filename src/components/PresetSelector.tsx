import React from 'react';
import { SAMPLE_CASES } from '../data/sampleCases';
import { SampleCase } from '../types/civic';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Zap,
  AlertCircle,
  Trash2,
  Lightbulb,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface PresetSelectorProps {
  onSelectCase: (sample: SampleCase) => void;
  selectedCaseId?: string | null;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelectCase, selectedCaseId }) => {
  return (
    <div className="glass-panel card-left-indigo rounded-2xl p-5 sm:p-6 shadow-glow-purple backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/15">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-100">
              Sample Scenarios
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any example to quickly test the AI analyzer
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-blue-400" />
          <span>1-Click Load</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SAMPLE_CASES.map((sample) => {
          const isSelected = selectedCaseId === sample.id;
          const isCaution = sample.category === 'unclear_insufficient';
          const isUnsupported = sample.category === 'unsupported_category';

          const IconComponent =
            sample.id === 'case-pothole' || sample.id === 'pothole-case'
              ? AlertCircle
              : sample.id === 'case-garbage' || sample.id === 'garbage-case'
              ? Trash2
              : sample.id === 'case-streetlight' || sample.id === 'streetlight-case'
              ? Lightbulb
              : sample.id === 'case-unclear' || sample.id === 'unclear-case'
              ? HelpCircle
              : Compass;

          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectCase(sample)}
              className={`btn-fade text-left p-3 rounded-xl border text-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-400 bg-purple-950/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/50'
                  : 'border-purple-500/20 bg-[#0f1225]/70 hover:border-purple-400/40 hover:bg-[#141833]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-semibold font-display text-white truncate flex items-center gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{sample.title}</span>
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-purple-500/10 flex items-center justify-between text-[10px]">
                <span
                  className={`font-mono px-2 py-0.5 rounded-md border ${
                    isCaution
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                      : isUnsupported
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                      : 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {isCaution ? 'Caution' : isUnsupported ? 'Out of Scope' : 'Standard'}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
