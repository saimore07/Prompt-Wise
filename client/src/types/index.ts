export type TaskCategory =
  | 'Auto'
  | 'Coding'
  | 'Writing'
  | 'Summarization'
  | 'Data Extraction'
  | 'Reasoning'
  | 'Creative'
  | 'Other';

export interface DetectedConstraints {
  mustPreserve: string[];
  outputFormat: string | null;
  lengthLimit: string | null;
  language: string | null;
  mustAvoid: string[];
  exactLiterals: string[];
}

export interface OptimizationWarning {
  code: string;
  message: string;
}

export interface Recommendation {
  variant: 'highContext' | 'lowToken' | 'original';
  reason: string;
}

export interface CostEstimate {
  inputCost: number | null;
  estimatedOutputTokens?: number | null;
  estimatedOutputCost?: number | null;
  totalCostPerCall?: number | null;
  costPer1kCalls?: number | null;
  currency: string;
  isEstimate: true;
  assumptions: string[];
}

export interface VerificationDetails {
  passed: boolean;
  mustPreserveSatisfied: string[];
  mustPreserveMissing: string[];
  exactLiteralsSatisfied: string[];
  exactLiteralsMissing: string[];
  negativeConstraintsViolated: string[];
  fallbackApplied: boolean;
}

export type TokenizerFamily =
  | 'openai-o200k'
  | 'openai-cl100k'
  | 'anthropic-claude'
  | 'llama3-nemotron'
  | 'google-gemini'
  | 'auto';

export interface StageTimings {
  totalMs: number;
  analysisAndGenerationMs: number;
  tokenCountingMs: number;
  verificationMs: number;
}

export interface Metrics {
  rawTokens: number | null;
  highContextTokens: number | null;
  lowTokenTokens: number | null;
  highContextChangePercent: number | null;
  lowTokenReductionPercent: number | null;
  measuredWith: string;
  tokenizerFamily?: TokenizerFamily;
  costEstimate: CostEstimate | null;
}

export interface CostArbitrageItem {
  model: string;
  provider: string;
  inputPricePerM: number;
  outputPricePerM: number;
  inputCost: number;
  estimatedOutputCost: number;
  totalCostPerCall: number;
  costPer1kCalls: number;
  savingsPercentVsBaseline: number;
}

export interface OptimizationResult {
  requestId: string;
  model: string;
  intentSummary: string;
  taskCategory: string;
  detectedConstraints: DetectedConstraints;
  rawPrompt: string;
  highContext: string;
  lowToken: string;
  warnings: OptimizationWarning[];
  securityWarnings?: string[];
  recommendation: Recommendation;
  metrics: Metrics;
  verificationStatus?: {
    highContext: VerificationDetails;
    lowToken: VerificationDetails;
  };
  timings?: StageTimings;
  isAlreadyOptimized?: boolean;
  optimizationStatus?: 'OPTIMIZED' | 'ALREADY_OPTIMIZED' | 'MINIMAL_GAINS';
  targetProvider?: string;
  arbitrageMetrics?: CostArbitrageItem[];
}

export interface ExecutionUsage {
  promptTokens: number | null;
  candidateTokens: number | null;
  totalTokens: number | null;
}

export interface ExecutionResult {
  requestId: string;
  prompt: string;
  response: string;
  model: string;
  latencyMs: number;
  usage: ExecutionUsage | null;
  timestamp: string;
}

export interface ServiceHealth {
  status: string;
  service: string;
  model: string;
  hasApiKey: boolean;
  historyEnabled: boolean;
  version: string;
  allowedModels?: string[];
  providers?: {
    nvidia?: boolean;
    google: boolean;
    openai: boolean;
    anthropic: boolean;
    deepseek: boolean;
    groq: boolean;
  };
}
