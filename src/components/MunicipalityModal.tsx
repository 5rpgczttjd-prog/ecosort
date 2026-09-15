import React, { useState } from 'react';
import { X, MapPin, Check, Plus, Locate, Building2, AlertCircle } from 'lucide-react';
import { MunicipalityPreset } from '../types';
import { MUNICIPALITY_PRESETS } from '../data/municipalities';

interface MunicipalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMunicipality: MunicipalityPreset;
  onSelectMunicipality: (municipality: MunicipalityPreset) => void;
}

export const MunicipalityModal: React.FC<MunicipalityModalProps> = ({
  isOpen,
  onClose,
  currentMunicipality,
  onSelectMunicipality,
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  // Custom city form fields
  const [customName, setCustomName] = useState<string>('');
  const [customRegion, setCustomRegion] = useState<string>('');
  const [customStream, setCustomStream] = useState<'single-stream' | 'dual-stream' | 'multi-stream'>('single-stream');
  const [customOrganics, setCustomOrganics] = useState<boolean>(true);
  const [customGlass, setCustomGlass] = useState<boolean>(true);
  const [customBags, setCustomBags] = useState<boolean>(false);
  const [customNotes, setCustomNotes] = useState<string>('');

  if (!isOpen) return null;

  // Attempt browser geolocation
  const handleDetectLocation = () => {
    setIsDetecting(true);
    setDetectionMessage(null);

    if (!navigator.geolocation) {
      setDetectionMessage('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Check approximate coordinates to match known regions or set generic
        // e.g. California (approx 32-42 lat, -124 to -114 lon) -> San Francisco preset
        // New York (approx 40.7 lat, -74 lon) -> New York City preset
        // Washington/Seattle (approx 47.6 lat, -122.3 lon) -> Seattle preset
        // Texas/Austin (approx 30.2 lat, -97.7 lon) -> Austin preset
        let matched = MUNICIPALITY_PRESETS[0];

        if (latitude >= 40.4 && latitude <= 41.0 && longitude >= -74.3 && longitude <= -73.6) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'new-york-city') || matched;
        } else if (latitude >= 47.0 && latitude <= 48.0 && longitude >= -122.6 && longitude <= -121.8) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'seattle') || matched;
        } else if (latitude >= 30.0 && latitude <= 30.6 && longitude >= -98.0 && longitude <= -97.5) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'austin') || matched;
        } else if (latitude >= 51.2 && latitude <= 51.7 && longitude >= -0.5 && longitude <= 0.3) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'london') || matched;
        } else if (latitude >= 52.3 && latitude <= 52.7 && longitude >= 13.1 && longitude <= 13.7) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'berlin') || matched;
        } else if (latitude >= 43.5 && latitude <= 43.9 && longitude >= -79.6 && longitude <= -79.1) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'toronto') || matched;
        } else if (latitude >= 37.0 && latitude <= 38.5 && longitude >= -123.0 && longitude <= -121.5) {
          matched = MUNICIPALITY_PRESETS.find((m) => m.id === 'san-francisco') || matched;
        } else {
          // If elsewhere, provide friendly notice
          setDetectionMessage(
            `Detected coordinates (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°). You can choose the closest city or customize your local city rules below!`
          );
          setIsDetecting(false);
          return;
        }

        onSelectMunicipality(matched);
        setIsDetecting(false);
        onClose();
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectionMessage('Location access was denied or unavailable. Please pick a city manually.');
        setIsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  // Submit custom municipality
  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customPreset: MunicipalityPreset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      region: customRegion.trim() || 'Custom Municipality',
      country: 'Local',
      streamType: customStream,
      curbsideOrganics: customOrganics,
      curbsideGlass: customGlass,
      acceptsPlasticBagsCurbside: customBags,
      binColors: {
        recycle: 'Blue Cart (Recycling)',
        compost: customOrganics ? 'Green Cart (Compost)' : undefined,
        trash: 'Grey/Black Cart (Trash)',
      },
      specialNotes: customNotes.trim() || `Custom municipal sorting rules for ${customName.trim()}.`,
      keyRulesSummary: [
        `${customStream.toUpperCase()} curbside recycling`,
        customOrganics ? 'Curbside organics/compost available' : 'No curbside compost',
        customBags ? 'Accepts clean plastic bags in cart' : 'No plastic film/bags in cart',
      ],
    };

    onSelectMunicipality(customPreset);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Municipality</h3>
              <p className="text-xs text-slate-500">
                Recycling rules vary by city. Pick your municipality to ensure accurate sorting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Auto-detect location button */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Quick Location Detection</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Locate className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                {isDetecting ? 'Detecting...' : 'Auto-Detect City'}
              </button>
            </div>
            {detectionMessage && (
              <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                {detectionMessage}
              </p>
            )}
          </div>

          {/* Toggle between preset list and custom creator */}
          {!isCustomMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Municipal Presets
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom City
                </button>
              </div>

              <div className="space-y-2">
                {MUNICIPALITY_PRESETS.map((preset) => {
                  const isSelected = currentMunicipality.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelectMunicipality(preset);
                        onClose();
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {preset.name}
                          </span>
                          <span className="text-xs text-slate-500">({preset.region})</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {preset.specialNotes}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                            {preset.streamType}
                          </span>
                          {preset.curbsideOrganics && (
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Curbside Compost
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom City Creator Form */
            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Define Your Municipal Guidelines</span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Back to presets
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Town Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Portland, Boulder, Vancouver"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State / Region / Country
                  </label>
                  <input
                    type="text"
                    value={customRegion}
                    onChange={(e) => setCustomRegion(e.target.value)}
                    placeholder="e.g. Oregon, USA"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Stream Type
                  </label>
                  <select
                    value={customStream}
                    onChange={(e) => setCustomStream(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="single-stream">Single-Stream (All recyclables in one bin)</option>
                    <option value="dual-stream">Dual-Stream (Paper separate from containers)</option>
                    <option value="multi-stream">Multi-Stream (Glass/paper/metal separated)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customOrganics}
                      onChange={(e) => setCustomOrganics(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Curbside food scraps / compost collection is provided</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customGlass}
                      onChange={(e) => setCustomGlass(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Glass bottles and jars are accepted curbside</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customBags}
                      onChange={(e) => setCustomBags(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Plastic bags/film are accepted in curbside cart</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Local Notes or Exceptions
                  </label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Pizza boxes accepted if clean; no styrofoam; bottle deposit 10¢"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Save & Use Guidelines
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
