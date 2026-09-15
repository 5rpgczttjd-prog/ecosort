import React from 'react';
import { X, Trash2, RotateCcw, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Award } from 'lucide-react';
import { RecycleAnalysisResult } from '../types';

interface ScanHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: RecycleAnalysisResult[];
  onSelectHistoricalItem: (item: RecycleAnalysisResult) => void;
  onClearHistory: () => void;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoricalItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  // Calculate diversion metrics
  const totalScans = history.length;
  const divertedCount = history.filter(
    (item) => item.verdict === 'yes' || item.primaryBin === 'compost' || item.primaryBin === 'recycle'
  ).length;
  const diversionRate = totalScans > 0 ? Math.round((divertedCount / totalScans) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white max-w-md w-full h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Scan History & Eco Log</h3>
            <p className="text-xs text-slate-500">Items sorted during this session</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diversion Score Summary */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center font-black">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                Landfill Diversion Rate
              </span>
              <p className="text-xl font-bold tracking-tight">{diversionRate}% Diverted</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200">{divertedCount} of {totalScans} sorted</span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <RotateCcw className="w-8 h-8 stroke-1" />
              <p className="text-sm font-medium">No items scanned yet.</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Take a photo or upload an image to start sorting with municipal AI guidance.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoricalItem(item);
                  onClose();
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.verdict === 'yes' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : item.verdict === 'conditional' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700">
                      {item.itemName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.binLabel}</span>
                    <span>•</span>
                    <span>{item.municipalityApplied.name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center text-slate-400 group-hover:text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Drawer Actions */}
        {history.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Session Log
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
