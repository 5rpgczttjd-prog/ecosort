import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Send,
  HelpCircle,
  Layers,
  ListOrdered,
  Leaf,
  Info,
  RotateCcw,
  Copy,
  Check,
  Building2,
  Trash2,
  Share2,
} from 'lucide-react';
import { RecycleAnalysisResult, MunicipalityPreset, ChatMessage, BinType } from '../types';

interface AnalysisResultViewProps {
  result: RecycleAnalysisResult;
  municipality: MunicipalityPreset;
  onScanAnother: () => void;
  onAskQuestion: (question: string) => Promise<string>;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  municipality,
  onScanAnother,
  onAskQuestion,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Bin color and theme mapping
  const getBinTheme = (bin: BinType) => {
    switch (bin) {
      case 'recycle':
        return {
          bgColor: 'bg-blue-600',
          textColor: 'text-blue-700',
          lightBg: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeBg: 'bg-blue-100',
          label: result.binLabel || 'Recycling Cart (Blue)',
        };
      case 'compost':
        return {
          bgColor: 'bg-emerald-600',
          textColor: 'text-emerald-700',
          lightBg: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeBg: 'bg-emerald-100',
          label: result.binLabel || 'Organics / Compost Cart (Green)',
        };
      case 'trash':
        return {
          bgColor: 'bg-slate-700',
          textColor: 'text-slate-800',
          lightBg: 'bg-slate-100',
          borderColor: 'border-slate-300',
          badgeBg: 'bg-slate-200',
          label: result.binLabel || 'Landfill / Trash (Black/Grey)',
        };
      case 'special_dropoff':
        return {
          bgColor: 'bg-purple-600',
          textColor: 'text-purple-700',
          lightBg: 'bg-purple-50',
          borderColor: 'border-purple-200',
          badgeBg: 'bg-purple-100',
          label: result.binLabel || 'Special Drop-Off / E-Waste',
        };
      case 'deposit_return':
        return {
          bgColor: 'bg-amber-600',
          textColor: 'text-amber-700',
          lightBg: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeBg: 'bg-amber-100',
          label: result.binLabel || 'Store Bottle Return / Deposit Scheme',
        };
    }
  };

  const binTheme = getBinTheme(result.primaryBin);

  // Verdict theme
  const getVerdictBadge = () => {
    switch (result.verdict) {
      case 'yes':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          title: 'Recyclable Curbside',
        };
      case 'conditional':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          title: 'Conditional / Separation Required',
        };
      case 'no':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          title: 'Not Recyclable Curbside',
        };
    }
  };

  const verdictBadge = getVerdictBadge();

  // Send follow-up question to AI
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = questionInput.trim();
    if (!q || isAsking) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setIsAsking(true);

    try {
      const answer = await onAskQuestion(q);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: answer,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I had trouble answering that. Please try again.',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  // Copy instructions to clipboard
  const handleCopyInstructions = () => {
    const text = `EcoSort AI Sorting Guide for ${result.itemName} (${municipality.name}):
- Verdict: ${result.headline}
- Target Bin: ${result.binLabel}
- Preparation:
${result.prepSteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
- Local Context: ${result.localRulesContext}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-12">
      {/* TOP HEADER: Item Name & Municipality Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Object Identified
              </span>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Confidence: {result.confidence}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {result.itemName}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleCopyInstructions}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy sorting instructions"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onScanAnother}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Another
            </button>
          </div>
        </div>

        {/* PRIMARY VERDICT BANNER */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${verdictBadge.bg}`}>
          {verdictBadge.icon}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider">
                {verdictBadge.title}
              </span>
              <span className="text-xs opacity-75">• {municipality.name} Guidelines</span>
            </div>
            <p className="text-base sm:text-lg font-bold leading-tight">
              {result.headline}
            </p>
          </div>
        </div>

        {/* TARGET BIN DIRECTIVE CARD */}
        <div className={`p-4 rounded-xl border ${binTheme.lightBg} ${binTheme.borderColor} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${binTheme.bgColor} text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0`}>
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Place In Destination Bin:
              </span>
              <p className={`text-base font-bold ${binTheme.textColor}`}>
                {binTheme.label}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-700 shrink-0">
            {municipality.streamType}
          </span>
        </div>
      </div>

      {/* MUNICIPAL REASONING ACCORDION / CONTEXT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Local Municipal Sorting Rule ({municipality.name})</span>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
          <p>{result.localRulesContext}</p>
        </div>
      </div>

      {/* MULTI-COMPONENT DECONSTRUCTION (If multi-material packaging) */}
      {result.materials && result.materials.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Material Component Breakdown ({result.materials.length} parts)</span>
            </div>
            <span className="text-[11px] text-slate-500">Separate before disposal</span>
          </div>

          <div className="space-y-2.5">
            {result.materials.map((mat, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900">
                      {mat.name}
                    </span>
                    <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {mat.material}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{mat.instruction}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                      mat.recyclable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {mat.binName || (mat.recyclable ? 'Recycle' : 'Trash')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP-BY-STEP PREPARATION STEPS */}
      {result.prepSteps && result.prepSteps.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ListOrdered className="w-4 h-4 text-emerald-600" />
            <span>Preparation Instructions</span>
          </div>

          <div className="space-y-2">
            {result.prepSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTAMINATION HAZARD WARNING (If any) */}
      {result.contaminationWarning && result.contaminationWarning.trim().length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Contamination Risk Warning
            </h4>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              {result.contaminationWarning}
            </p>
          </div>
        </div>
      )}

      {/* SUSTAINABILITY TIP & ENERGY SAVINGS METRIC */}
      <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span>Circular Economy & Eco Insight</span>
        </div>
        <p className="text-sm font-medium text-emerald-100 leading-relaxed">
          {result.ecoTip}
        </p>
        {result.carbonOrWasteInsight && (
          <div className="pt-2 border-t border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{result.carbonOrWasteInsight}</span>
          </div>
        )}
      </div>

      {/* INTERACTIVE FOLLOW-UP ASSISTANT: Ask EcoSort AI */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Have a question about this item?</span>
        </div>
        <p className="text-xs text-slate-500">
          Ask Gemini AI for further clarification regarding lids, grease, rinsing, or special municipal disposal.
        </p>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {['Do I need to wash it clean?', 'Can I leave the label on?', 'What if it is greasy?'].map(
            (suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuestionInput(suggestion)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            )
          )}
        </div>

        {/* Chat History */}
        {chatMessages.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 border-t border-slate-100 pt-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question input form */}
        <form onSubmit={handleSendQuestion} className="flex gap-2">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder={`Ask about recycling ${result.itemName}...`}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!questionInput.trim() || isAsking}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isAsking ? (
              <span className="animate-spin text-xs">●</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onScanAnother}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Another Item
        </button>
      </div>
    </div>
  );
};
