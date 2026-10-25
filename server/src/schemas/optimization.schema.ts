import { z } from 'zod';
import { config } from '../config/env.js';

export const TaskCategoryEnum = z.enum([
  'Auto',
  'Coding',
  'Writing',
  'Summarization',
  'Data Extraction',
  'Reasoning',
  'Creative',
  'Other',
]);

export type TaskCategory = z.infer<typeof TaskCategoryEnum>;

export const TokenizerFamilyEnum = z.enum([
  'openai-o200k',
  'openai-cl100k',
  'anthropic-claude',
  'llama3-nemotron',
  'google-gemini',
  'auto',
]);

export type TokenizerFamily = z.infer<typeof TokenizerFamilyEnum>;

export const OptimizationRequestSchema = z.object({
  rawPrompt: z
    .string({ required_error: 'rawPrompt is required' })
    .trim()
    .min(1, { message: 'Prompt cannot be empty or whitespace-only' })
    .max(config.MAX_PROMPT_CHARS, {
      message: `Prompt exceeds maximum allowed length of ${config.MAX_PROMPT_CHARS} characters`,
    }),
  taskCategory: TaskCategoryEnum.optional().default('Auto'),
  model: z.string().optional(),
  modelFamily: z.string().optional(),
  tokenizerFamily: TokenizerFamilyEnum.optional().default('auto'),
  stream: z.boolean().optional().default(false),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export const DetectedConstraintsSchema = z.object({
  mustPreserve: z.array(z.string()).default([]),
  outputFormat: z.string().nullable().default(null),
  lengthLimit: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  mustAvoid: z.array(z.string()).default([]),
  exactLiterals: z.array(z.string()).default([]),
});

export type DetectedConstraints = z.infer<typeof DetectedConstraintsSchema>;

export const OptimizationWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type OptimizationWarning = z.infer<typeof OptimizationWarningSchema>;

export const RecommendationSchema = z.object({
  variant: z.enum(['highContext', 'lowToken', 'original']),
  reason: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const CostEstimateSchema = z.object({
  inputCost: z.number().nullable(),
  estimatedOutputTokens: z.number().nullable().optional(),
  estimatedOutputCost: z.number().nullable().optional(),
  totalCostPerCall: z.number().nullable().optional(),
  costPer1kCalls: z.number().nullable().optional(),
  currency: z.string(),
  isEstimate: z.literal(true),
  assumptions: z.array(z.string()),
});

export type CostEstimate = z.infer<typeof CostEstimateSchema>;

export const VerificationDetailsSchema = z.object({
  passed: z.boolean(),
  mustPreserveSatisfied: z.array(z.string()).default([]),
  mustPreserveMissing: z.array(z.string()).default([]),
  exactLiteralsSatisfied: z.array(z.string()).default([]),
  exactLiteralsMissing: z.array(z.string()).default([]),
  negativeConstraintsViolated: z.array(z.string()).default([]),
  fallbackApplied: z.boolean().default(false),
});

export type VerificationDetails = z.infer<typeof VerificationDetailsSchema>;

export const StageTimingsSchema = z.object({
  totalMs: z.number(),
  analysisAndGenerationMs: z.number(),
  tokenCountingMs: z.number(),
  verificationMs: z.number(),
});

export type StageTimings = z.infer<typeof StageTimingsSchema>;

export const MetricsSchema = z.object({
  rawTokens: z.number().nullable(),
  highContextTokens: z.number().nullable(),
  lowTokenTokens: z.number().nullable(),
  highContextChangePercent: z.number().nullable(),
  lowTokenReductionPercent: z.number().nullable(),
  measuredWith: z.string(),
  tokenizerFamily: TokenizerFamilyEnum.optional(),
  costEstimate: CostEstimateSchema.nullable(),
});

export type Metrics = z.infer<typeof MetricsSchema>;

export const CostArbitrageItemSchema = z.object({
  model: z.string(),
  provider: z.string(),
  inputPricePerM: z.number(),
  outputPricePerM: z.number(),
  inputCost: z.number(),
  estimatedOutputCost: z.number(),
  totalCostPerCall: z.number(),
  costPer1kCalls: z.number(),
  savingsPercentVsBaseline: z.number(),
});

export type CostArbitrageItem = z.infer<typeof CostArbitrageItemSchema>;

export const OptimizationResultSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  intentSummary: z.string(),
  taskCategory: z.string(),
  detectedConstraints: DetectedConstraintsSchema,
  rawPrompt: z.string(),
  highContext: z.string(),
  lowToken: z.string(),
  warnings: z.array(OptimizationWarningSchema),
  securityWarnings: z.array(z.string()).default([]),
  recommendation: RecommendationSchema,
  metrics: MetricsSchema,
  verificationStatus: z
    .object({
      highContext: VerificationDetailsSchema,
      lowToken: VerificationDetailsSchema,
    })
    .optional(),
  timings: StageTimingsSchema.optional(),
  isAlreadyOptimized: z.boolean().default(false),
  optimizationStatus: z.enum(['OPTIMIZED', 'ALREADY_OPTIMIZED', 'MINIMAL_GAINS']).default('OPTIMIZED'),
  targetProvider: z.string().optional(),
  arbitrageMetrics: z.array(CostArbitrageItemSchema).optional(),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

// Raw LLM output schema expected from the structured Gemini call
export const GeminiOptimizationOutputSchema = z.object({
  intentSummary: z.string().default(''),
  taskCategory: z.string().default('General'),
  detectedConstraints: DetectedConstraintsSchema.default({
    mustPreserve: [],
    outputFormat: null,
    lengthLimit: null,
    language: null,
    mustAvoid: [],
    exactLiterals: [],
  }),
  highContext: z.string({ required_error: 'High-context variant is required' }),
  lowToken: z.string({ required_error: 'Low-token variant is required' }),
  warnings: z.array(OptimizationWarningSchema).default([]),
  recommendation: RecommendationSchema.default({
    variant: 'lowToken',
    reason: 'Preserves essential requirements with improved efficiency.',
  }),
});

export type GeminiOptimizationOutput = z.infer<typeof GeminiOptimizationOutputSchema>;
