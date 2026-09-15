import React from 'react';
import { X, BookOpen, AlertOctagon, CheckCircle2, Trash2, Leaf, ShieldAlert } from 'lucide-react';
import { MunicipalityPreset } from '../types';

interface MunicipalGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  municipality: MunicipalityPreset;
}

export const MunicipalGuidelinesModal: React.FC<MunicipalGuidelinesModalProps> = ({
  isOpen,
  onClose,
  municipality,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {municipality.name} Sorting Rules
              </h3>
              <p className="text-xs text-slate-500">
                Official Municipal Waste & Recycling Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Municipal Summary */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              System Overview
            </span>
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
              {municipality.specialNotes}
            </p>
          </div>

          {/* Key Accepted Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Core Sorting Directives</span>
            </div>
            <div className="space-y-1.5">
              {municipality.keyRulesSummary.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span className="leading-snug">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bins Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Recycling */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-xs font-bold text-blue-900">
                  {municipality.binColors.recycle}
                </h4>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Empty, clean, and dry plastic containers, paper, cardboard, and aluminum cans. No greasy food boxes.
              </p>
            </div>

            {/* Compost / Organics */}
            {municipality.curbsideOrganics && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900">
                    {municipality.binColors.compost || 'Green Cart (Organics)'}
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Food scraps, food-soiled paper towels, coffee grounds, and greasy pizza boxes.
                </p>
              </div>
            )}

            {/* Landfill / Trash */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <h4 className="text-xs font-bold text-slate-900">
                  {municipality.binColors.trash}
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Non-recyclable wrappers, plastic foam #6 (Styrofoam), coated paper cups, and broken ceramic.
              </p>
            </div>

            {/* Special / Hazardous Drop-Off */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <h4 className="text-xs font-bold text-purple-900">Special Drop-off Only</h4>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Batteries, electronics, paints, chemicals, fluorescent tubes. Never in curbside carts.
              </p>
            </div>
          </div>

          {/* Universal Contaminants Warning */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Universal Contaminants (Keep Out of Blue Bin)</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              1. <strong>Plastic film & grocery bags</strong> (tanglers that shut down sorting machinery).<br />
              2. <strong>Batteries & Electronics</strong> (fire ignition hazard inside compactor trucks).<br />
              3. <strong>Heavy food grease/liquids</strong> (destroys whole truckloads of recycled paper).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guidelines
          </button>
        </div>
      </div>
    </div>
  );
};
