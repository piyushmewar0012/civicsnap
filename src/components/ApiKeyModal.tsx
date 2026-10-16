import React, { useState } from 'react';
import { X, Key, Check, Info } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
}) => {
  const [inputVal, setInputVal] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(inputVal.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputVal('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel card-left-indigo w-full max-w-md rounded-2xl shadow-glow-purple flex flex-col overflow-hidden border border-purple-500/30">
        <div className="px-6 py-4.5 border-b border-purple-500/20 flex items-center justify-between bg-[#0b0e22]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-purple border border-purple-400/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Google Gemini API Key
              </h2>
              <p className="text-[11px] text-slate-400">
                Optional cloud vision AI configuration
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

        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 flex items-start gap-2 shadow-inner">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Optional Configuration:</strong> CivicSnap works seamlessly with Open Source AI (Ollama/LLaMA 3.2 Vision) or local heuristics without needing a Google key. Adding an API key enables Gemini 1.5/2.5 Flash cloud vision.
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-key-input" className="block text-xs font-semibold text-slate-300 font-mono">
              API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl font-mono text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[10px] text-slate-500">
              Stored locally in your browser and used only to communicate directly with Google Gemini.
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#0b0e22]/90 border-t border-purple-500/20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="btn-fade text-xs text-slate-400 hover:text-rose-400 font-medium"
          >
            Clear Key
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-fade px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-fade inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all shadow-glow-purple border border-purple-400/30"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{saved ? 'Saved!' : 'Save Key'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
