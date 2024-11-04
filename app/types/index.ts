// Create a types file to share interfaces across components
export interface ValidationData {
  isValid: boolean;
  score: number;
  message: string;
}

export interface MxRecord {
  priority: number;
  exchange: string;
}

export interface MxAnalysisData {
  hasMxRecords: boolean;
  hasMultipleMx: boolean;
  hasDifferentWeights: boolean;
  onSameDomain: boolean;
  records: MxRecord[];
  details: string[];
  score: number;
  scoreDetails: string[];
}

export interface SpfData {
  exists: boolean;
  record: string | null;
  details: string[];
  score: number;
  scoreDetails: string[];
}

export interface DmarcData {
  exists: boolean;
  record: string | null;
  details: string[];
  score: number;
  scoreDetails: string[];
}

export interface EmailSecurityData {
  spf: SpfData;
  dmarc: DmarcData;
  totalScore: number;
}

export interface ExpiryData {
  aiAnalysis: {
    expiry: string;
  };
  expiryScore: {
    score: number;
    message: string;
    daysUntilExpiry: number;
  };
}

export interface AnalysisState<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

export interface Results {
  validation?: AnalysisState<ValidationData>;
  mxAnalysis?: AnalysisState<MxAnalysisData>;
  emailSecurity?: AnalysisState<EmailSecurityData>;
  expiryAnalysis?: AnalysisState<ExpiryData>;
}
