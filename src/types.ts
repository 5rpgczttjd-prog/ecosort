export type RecycleVerdict = 'yes' | 'no' | 'conditional';

export type BinType = 'recycle' | 'compost' | 'trash' | 'special_dropoff' | 'deposit_return';

export interface MaterialComponent {
  name: string;
  material: string;
  recyclable: boolean;
  bin: BinType;
  binName?: string;
  instruction: string;
}

export interface RecycleAnalysisResult {
  id: string;
  timestamp: number;
  itemName: string;
  confidence: 'high' | 'medium' | 'low';
  verdict: RecycleVerdict;
  headline: string;
  primaryBin: BinType;
  binLabel: string;
  municipalityApplied: {
    name: string;
    region: string;
  };
  materials: MaterialComponent[];
  prepSteps: string[];
  localRulesContext: string;
  contaminationWarning?: string;
  ecoTip: string;
  carbonOrWasteInsight?: string;
  resinCode?: string;
  alternativeDisposal?: string;
  photoUrl?: string;
}

export interface MunicipalityPreset {
  id: string;
  name: string;
  region: string;
  country: string;
  streamType: 'single-stream' | 'dual-stream' | 'multi-stream';
  curbsideOrganics: boolean;
  curbsideGlass: boolean;
  acceptsPlasticBagsCurbside: boolean;
  binColors: {
    recycle: string;
    compost?: string;
    trash: string;
  };
  specialNotes: string;
  keyRulesSummary: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
