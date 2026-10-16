import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { LocationInput } from './components/LocationInput';
import { PresetSelector } from './components/PresetSelector';
import { ResultView } from './components/ResultView';
import { ReportsFeed } from './components/ReportsFeed';
import { PRDModal } from './components/PRDPrincipleDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { OpenSourceAiModal } from './components/OpenSourceAiModal';
import { analyzeCivicIssue } from './services/civicAnalyzer';
import { isSupabaseConfigured, getSupabase } from './services/supabaseClient';
import { getCurrentUser } from './services/authService';
import { AnalysisResult, SampleCase, IssueCategory, AIProvider, OpenSourceAiConfig } from './types/civic';
import { User } from '@supabase/supabase-js';
import {
  ArrowRight,
  Loader2,
  Cpu,
  Layers,
  Zap,
  Sparkles,
  Settings,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'assess' | 'reports'>('assess');

  // State for flow
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [presetCategory, setPresetCategory] = useState<IssueCategory | undefined>(undefined);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analysis status & results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // AI Provider & Open Source AI config (defaults to opensource)
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('civicsnap_ai_provider') as AIProvider) || 'opensource';
  });

  const [openSourceConfig, setOpenSourceConfig] = useState<OpenSourceAiConfig>(() => {
    return {
      endpoint: localStorage.getItem('civicsnap_os_endpoint') || 'http://localhost:11434/v1',
      model: localStorage.getItem('civicsnap_os_model') || 'llama3.2-vision',
      apiKey: localStorage.getItem('civicsnap_os_key') || '',
    };
  });

  // Modals & integrations
  const [isPRDOpen, setIsPRDOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOpenSourceModalOpen, setIsOpenSourceModalOpen] = useState(false);
  const [hasSupabase, setHasSupabase] = useState<boolean>(() => isSupabaseConfigured());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('civiclens_gemini_api_key') || '';
  });

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('civiclens_gemini_api_key', key);
  };

  const handleSaveOpenSourceConfig = (newConfig: OpenSourceAiConfig) => {
    setOpenSourceConfig(newConfig);
    localStorage.setItem('civicsnap_os_endpoint', newConfig.endpoint);
    localStorage.setItem('civicsnap_os_model', newConfig.model);
    if (newConfig.apiKey) {
      localStorage.setItem('civicsnap_os_key', newConfig.apiKey);
    } else {
      localStorage.removeItem('civicsnap_os_key');
    }
  };

  const handleSelectAiProvider = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem('civicsnap_ai_provider', provider);
  };

  // Listen to Supabase Auth state & database session
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      const user = await getCurrentUser();
      if (isMounted && user) setCurrentUser(user);
    };
    checkUser();

    // Listen to custom auth event for instant synchronous UI updates
    const handleAuthChange = (e: any) => {
      if (isMounted) setCurrentUser(e.detail);
    };
    window.addEventListener('civicsnap_auth_state_change', handleAuthChange);

    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (session?.user) {
          setCurrentUser(session.user);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
        window.removeEventListener('civicsnap_auth_state_change', handleAuthChange);
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener('civicsnap_auth_state_change', handleAuthChange);
    };
  }, [hasSupabase]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedCaseId(null);
    setPresetCategory(undefined);
    setUploadError(null);
  };

  const handleClearPhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedCaseId(null);
    setPresetCategory(undefined);
    setUploadError(null);
  };

  const handleSelectPreset = (sample: SampleCase) => {
    setSelectedCaseId(sample.id);
    setPreviewUrl(sample.imageUrl);
    setSelectedFile(null);
    setLocation(sample.location);
    setPresetCategory(sample.category);
    setUploadError(null);
    setResult(null);
  };

  const handleStartAnalysis = async () => {
    if (!previewUrl) {
      setUploadError('Please select or upload a photo to analyze.');
      return;
    }
    if (!location.trim()) {
      alert('Please enter a location or landmark before generating the draft.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatusText(
      aiProvider === 'opensource'
        ? `Analyzing with Open Source Vision AI (${openSourceConfig.model})...`
        : aiProvider === 'gemini'
        ? 'Analyzing with Google Gemini Vision...'
        : 'Analyzing with local heuristic engine...'
    );

    const timer1 = setTimeout(() => {
      setAnalysisStatusText('Extracting visible details and observations...');
    }, 450);

    const timer2 = setTimeout(() => {
      setAnalysisStatusText('Composing polite, evidence-based complaint draft...');
    }, 900);

    try {
      const res = await analyzeCivicIssue({
        imageFile: selectedFile || undefined,
        imageUrl: previewUrl,
        imageName: selectedFile?.name || (selectedCaseId ? `${selectedCaseId}.jpg` : 'uploaded-photo.jpg'),
        location: location.trim(),
        presetCategory,
        apiKey: apiKey || undefined,
        aiProvider,
        openSourceEndpoint: openSourceConfig.endpoint,
        openSourceModel: openSourceConfig.model,
        openSourceApiKey: openSourceConfig.apiKey,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Analysis error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatusText('');
    }
  };

  const handleReset = () => {
    setResult(null);
    handleClearPhoto();
    setLocation('');
  };

  const isFormReady = Boolean(previewUrl && location.trim().length > 0 && !isAnalyzing);

  return (
    <div className="min-h-screen bg-[#080913] text-slate-300 font-sans flex flex-col relative selection:bg-purple-600/40 selection:text-purple-200">
      {/* Subtle Grain Texture Overlay */}
      <div className="grain-overlay" />

      {/* Ambient Purple to Blue Radiant Glow Meshes */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/15 to-blue-500/15 blur-[140px] rounded-full z-0" />
      <div className="pointer-events-none fixed top-1/2 -left-48 w-[600px] h-[600px] bg-purple-900/10 blur-[160px] rounded-full z-0" />
      <div className="pointer-events-none fixed -bottom-40 -right-48 w-[650px] h-[650px] bg-blue-900/10 blur-[160px] rounded-full z-0" />

      {/* Top Navigation */}
      <Header
        onOpenPRD={() => setIsPRDOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        hasApiKey={Boolean(apiKey)}
        onOpenOpenSourceAi={() => setIsOpenSourceModalOpen(true)}
        aiProvider={aiProvider}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 relative z-10">
        {activeTab === 'reports' ? (
          <ReportsFeed
            onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : (
          <>
            {/* Clean Hero Section */}
            <div className="text-center max-w-2xl mx-auto space-y-3 pt-2 animate-fade-in-up">
              <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-purple-300 via-indigo-100 to-blue-300 bg-clip-text text-transparent">
                  Report Civic Issues
                </span>{' '}
                <span className="text-slate-100">
                  in Seconds
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Upload a photo of potholes, garbage piles, or broken streetlights to automatically generate an evidence-grounded municipal complaint.
              </p>

              {/* AI Engine Switcher */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-[#11142c]/90 border border-purple-500/30 text-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSelectAiProvider('opensource')}
                    className={`btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      aiProvider === 'opensource'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-300" />
                    <span>Open Source AI ({openSourceConfig.model})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAiProvider('gemini')}
                    className={`btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      aiProvider === 'gemini'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-blue-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-300" />
                    <span>Gemini 1.5</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAiProvider('heuristic')}
                    className={`btn-fade inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      aiProvider === 'heuristic'
                        ? 'bg-purple-950 text-purple-200 border border-purple-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Local Heuristic</span>
                  </button>
                </div>

                {aiProvider === 'opensource' && (
                  <button
                    type="button"
                    onClick={() => setIsOpenSourceModalOpen(true)}
                    className="btn-fade inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141830] hover:bg-[#1d2347] border border-purple-500/25 text-purple-300 text-xs font-mono"
                    title="Configure Open Source AI Endpoint & Model"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                )}
              </div>
            </div>

            {/* Presets (Sample Benchmarks) */}
            {!result && (
              <PresetSelector
                onSelectCase={handleSelectPreset}
                selectedCaseId={selectedCaseId}
              />
            )}

            {/* Workflow Ingestion Module */}
            {!result ? (
              <div className="glass-panel card-left-indigo rounded-3xl p-6 sm:p-7 shadow-glow-purple backdrop-blur-xl space-y-6">
                {/* Step 1: Upload */}
                <PhotoUploader
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onFileSelect={handleFileSelect}
                  onClear={handleClearPhoto}
                  errorMessage={uploadError}
                  setErrorMessage={setUploadError}
                />

                {/* Step 2: Location */}
                <LocationInput
                  location={location}
                  onChange={setLocation}
                  disabled={isAnalyzing}
                />

                {/* Action Trigger Button */}
                <div className="pt-3 border-t border-purple-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Generates factual observations based strictly on photo evidence.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    disabled={!isFormReady}
                    className={`btn-fade w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all border ${
                      isFormReady
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-purple-400/50 shadow-glow-purple'
                        : 'bg-[#151930] text-slate-600 border-purple-500/10 cursor-not-allowed'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                        <span>Analyzing Photo...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Complaint Draft</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Analysis In-Progress Status Indicator */}
                {isAnalyzing && (
                  <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-3 animate-fade-in-up">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                    <span className="font-mono">{analysisStatusText}</span>
                  </div>
                )}
              </div>
            ) : (
              <ResultView
                result={result}
                photoFile={selectedFile}
                onReset={handleReset}
                onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
                onViewSavedReports={() => setActiveTab('reports')}
              />
            )}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-purple-500/20 bg-[#070811]/90 backdrop-blur-xl py-5 text-slate-400 text-xs relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-white font-display">CivicSnap</span>
            <span className="mx-1 text-purple-400">•</span>
            <span>AI-assisted civic issue documentation & complaint drafting</span>
          </div>
          <div>
            <button
              onClick={() => setIsPRDOpen(true)}
              className="btn-fade hover:text-white underline underline-offset-2 font-mono text-[11px]"
            >
              PRD Scope & Guidelines
            </button>
          </div>
        </div>
      </footer>

      {/* PRD Reference Modal */}
      <PRDModal isOpen={isPRDOpen} onClose={() => setIsPRDOpen(false)} />

      {/* Open Source AI Modal */}
      <OpenSourceAiModal
        isOpen={isOpenSourceModalOpen}
        onClose={() => setIsOpenSourceModalOpen(false)}
        config={openSourceConfig}
        onSaveConfig={handleSaveOpenSourceConfig}
      />

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      {/* Supabase Database & Storage Modal */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onConfigChanged={() => setHasSupabase(isSupabaseConfigured())}
      />

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthChanged={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
};
