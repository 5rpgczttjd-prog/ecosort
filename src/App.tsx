/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { AnalysisResultView } from './components/AnalysisResultView';
import { MunicipalityModal } from './components/MunicipalityModal';
import { MunicipalGuidelinesModal } from './components/MunicipalGuidelinesModal';
import { ScanHistoryDrawer } from './components/ScanHistoryDrawer';
import { MUNICIPALITY_PRESETS } from './data/municipalities';
import { MunicipalityPreset, RecycleAnalysisResult } from './types';
import { Sparkles, AlertCircle, RefreshCw, MapPin, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  // Current municipality
  const [currentMunicipality, setCurrentMunicipality] = useState<MunicipalityPreset>(() => {
    try {
      const saved = localStorage.getItem('ecosort_municipality');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved municipality:', e);
    }
    return MUNICIPALITY_PRESETS[0]; // Default: San Francisco
  });

  // Scan History
  const [history, setHistory] = useState<RecycleAnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem('ecosort_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved history:', e);
    }
    return [];
  });

  // Active view & Analysis
  const [activeView, setActiveView] = useState<'scan' | 'result'>('scan');
  const [currentAnalysis, setCurrentAnalysis] = useState<RecycleAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingStage, setAnalyzingStage] = useState<string>('Uploading image...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('ecosort_municipality', JSON.stringify(currentMunicipality));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [currentMunicipality]);

  useEffect(() => {
    try {
      localStorage.setItem('ecosort_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [history]);

  // Handle capture and analyze image
  const handleCapture = async (
    base64Image: string,
    mimeType: string,
    userNotes?: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzingStage('Sending photo to Gemini AI...');

    // Progressive stage simulation for reassuring feedback
    const stageTimer1 = setTimeout(() => {
      setAnalyzingStage('Detecting materials, components & resin codes...');
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setAnalyzingStage(`Evaluating ${currentMunicipality.name} municipal regulations...`);
    }, 2500);

    try {
      const response = await fetch('/api/analyze-recyclable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType,
          municipality: currentMunicipality,
          userNotes,
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error (${response.status})`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.error || 'Failed to analyze item.');
      }

      const analysisResult: RecycleAnalysisResult = {
        ...resData.data,
        photoUrl: base64Image,
      };

      setCurrentAnalysis(analysisResult);
      setHistory((prev) => [analysisResult, ...prev]);
      setActiveView('result');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setErrorMessage(
        err.message || 'An error occurred while recognizing the item. Please verify your photo and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Ask AI follow-up question
  const handleAskQuestion = async (question: string): Promise<string> => {
    const response = await fetch('/api/ask-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        currentAnalysis,
        municipality: currentMunicipality,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch AI response');
    }

    const data = await response.json();
    return data.answer;
  };

  // Clear session history
  const handleClearHistory = () => {
    if (window.confirm('Clear all session scan logs?')) {
      setHistory([]);
      setIsHistoryDrawerOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        currentMunicipality={currentMunicipality}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenGuidelinesModal={() => setIsGuidelinesModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
        {/* Error Banner if any */}
        {errorMessage && (
          <div className="w-full max-w-2xl mb-5 bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider">Analysis Notice</p>
                <p className="text-xs sm:text-sm text-rose-800">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 bg-rose-100/70 rounded-md cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* LOADING STATE OVERLAY */}
        {isAnalyzing && (
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-lg my-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Gemini AI is analyzing your item...</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {analyzingStage}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Checking against {currentMunicipality.name} Municipal Waste Code</span>
            </div>
          </div>
        )}

        {/* VIEW 1: Camera Scanner & Input View */}
        {!isAnalyzing && activeView === 'scan' && (
          <div className="w-full space-y-6">
            {/* Header info banner */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Active Sorting Guide: {currentMunicipality.name}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Recycling Camera Scanner
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Aim your phone camera at any packaging, container, or object. Gemini AI identifies
                the materials and provides exact municipal sorting directions.
              </p>
            </div>

            {/* Camera Component */}
            <CameraScanner
              onCapture={handleCapture}
              isAnalyzing={isAnalyzing}
              municipality={currentMunicipality}
            />
          </div>
        )}

        {/* VIEW 2: Analysis Results View */}
        {!isAnalyzing && activeView === 'result' && currentAnalysis && (
          <AnalysisResultView
            result={currentAnalysis}
            municipality={currentMunicipality}
            onScanAnother={() => {
              setActiveView('scan');
              setCurrentAnalysis(null);
            }}
            onAskQuestion={handleAskQuestion}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            EcoSort AI • Powered by Gemini 3.8 Flash Multimodal Vision
          </p>
          <p className="text-slate-400">
            Rules calibrated to {currentMunicipality.name} ({currentMunicipality.region})
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <MunicipalityModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentMunicipality={currentMunicipality}
        onSelectMunicipality={(m) => setCurrentMunicipality(m)}
      />

      <MunicipalGuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={() => setIsGuidelinesModalOpen(false)}
        municipality={currentMunicipality}
      />

      <ScanHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onSelectHistoricalItem={(item) => {
          setCurrentAnalysis(item);
          setActiveView('result');
        }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
