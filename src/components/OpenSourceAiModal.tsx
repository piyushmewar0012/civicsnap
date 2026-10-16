import React, { useState } from 'react';
import { X, Cpu, Check, Info, Server, RefreshCw } from 'lucide-react';
import { OpenSourceAiConfig } from '../types/civic';

interface OpenSourceAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OpenSourceAiConfig;
  onSaveConfig: (config: OpenSourceAiConfig) => void;
}

export const OpenSourceAiModal: React.FC<OpenSourceAiModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [endpoint, setEndpoint] = useState(config.endpoint || 'http://localhost:11434/v1');
  const [model, setModel] = useState(config.model || 'llama3.2-vision');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      endpoint: endpoint.trim(),
      model: model.trim(),
      apiKey: apiKey.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = endpoint.trim().replace(/\/+$/, '');
      const testUrl = cleanUrl.includes('/models') ? cleanUrl : `${cleanUrl}/models`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(testUrl, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Connected successfully to Open Source AI endpoint (${model}).`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Server returned HTTP ${res.status}. Please verify your endpoint and model name.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Endpoint unreachable (${err.message || 'connection refused'}). Please verify your local AI server (e.g. Ollama) is running.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-panel card-left-purple w-full max-w-lg rounded-2xl shadow-glow-purple flex flex-col overflow-hidden border border-purple-500/30">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-purple-500/20 flex items-center justify-between bg-[#0b0e22]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-purple border border-purple-400/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Open Source Vision AI
              </h2>
              <p className="text-[11px] text-slate-400">
                Ollama • Meta LLaMA 3.2 Vision • Qwen 2.5-VL • Local Inference
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

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 flex items-start gap-2 shadow-inner">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Privacy-Focused AI:</strong> Run vision models completely locally with Ollama (e.g. <code className="bg-purple-900/50 px-1 py-0.5 rounded">llama3.2-vision</code>) or connect to any OpenAI-compatible vision endpoint.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
              <span>Endpoint URL</span>
              <span className="text-purple-400 text-[10px]">Default: http://localhost:11434/v1</span>
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl font-mono text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
              <span>Model Name</span>
              <span className="text-purple-400 text-[10px]">e.g. llama3.2-vision, qwen2.5-vl</span>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama3.2-vision"
              className="w-full px-3.5 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl font-mono text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 font-mono">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave blank for local Ollama"
              className="w-full px-3.5 py-2.5 text-xs bg-[#090b17] border border-purple-500/30 rounded-xl font-mono text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Test connection output */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0b0e22]/90 border-t border-purple-500/20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="btn-fade inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
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
              className="btn-fade inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-glow-purple border border-purple-400/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
