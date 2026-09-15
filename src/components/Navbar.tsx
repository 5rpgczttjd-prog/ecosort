import React from 'react';
import { MapPin, Recycle, History, BookOpen, ChevronDown } from 'lucide-react';
import { MunicipalityPreset } from '../types';

interface NavbarProps {
  currentMunicipality: MunicipalityPreset;
  onOpenLocationModal: () => void;
  onOpenGuidelinesModal: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMunicipality,
  onOpenLocationModal,
  onOpenGuidelinesModal,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Recycle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">EcoSort AI</span>
              <span className="text-[10px] font-semibold tracking-wide bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                MUNICIPAL
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Camera Recycling & Waste Sorter</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Municipality Selector Pill */}
          <button
            id="btn-select-municipality"
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-300/80 rounded-full py-1.5 px-3 transition-colors text-left"
            title="Change local municipality guidelines"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {currentMunicipality.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Guidelines Guide */}
          <button
            id="btn-view-guidelines"
            onClick={onOpenGuidelinesModal}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View municipal sorting rules"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* History / Log Button */}
          <button
            id="btn-view-history"
            onClick={onOpenHistory}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Scan History & Stats"
          >
            <History className="w-5 h-5" />
            {historyCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
