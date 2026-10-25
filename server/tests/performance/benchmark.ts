import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { FakeGeminiService, GeminiService } from '../../src/services/gemini.service.js';
import { OptimizerService } from '../../src/services/optimizer.service.js';
import { ExecutorService } from '../../src/services/executor.service.js';
import supertest from 'supertest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BenchmarkCase {
  id: string;
  name: string;
  category: string;
  rawPrompt: string;
}

export interface CaseLatencyMetrics {
  caseId: string;
  name: string;
  iterations: number;
  durationsMs: number[];
  p50Ms: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  rawTokens: number | null;
  highContextTokens: number | null;
  lowTokenTokens: number | null;
  tokenReductionPercent: number | null;
  modelCallsPerRequest: number;
}

export interface BenchmarkReport {
  timestamp: string;
  environment: string;
  mode: 'offline_mock' | 'live_api';
  model: string;
  totalCases: number;
  iterationsPerCase: number;
  summary: {
    overallP50Ms: number;
    overallP95Ms: number;
    overallAvgMs: number;
    minMs: number;
    maxMs: number;
    totalRequests: number;
  };
  cases: CaseLatencyMetrics[];
}

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: 'case-01-filler',
    name: 'Simple Prompt with Filler',
    category: 'Writing',
    rawPrompt: 'Hello! I hope you are having a wonderful day. Could you please kindly be so good as to summarize the following article about renewable solar energy for my team? Thank you so very much!',
  },
  {
    id: 'case-02-strict-json',
    name: 'Strict JSON with Negative Constraints',
    category: 'Data Extraction',
    rawPrompt: 'Extract name, age, and email from the input text. Return valid JSON only with keys "name", "age", "email". Do not include markdown code fences or any conversational preamble or postscript.',
  },
  {
    id: 'case-03-code-literal',
    name: 'Code, Regex & Path Literals',
    category: 'Coding',
    rawPrompt: 'Debug the script at src/server/index.ts. Ensure npm run test:unit passes and verify process.env.GEMINI_API_KEY is loaded using regex /^AIza[0-9A-Za-z-_]{35}$/.',
  },
  {
    id: 'case-04-long-redundant',
    name: 'Long Enterprise Redundant Context',
    category: 'Reasoning',
    rawPrompt: 'We are currently evaluating our Q3 cloud infrastructure spend across multiple AWS availability zones. As we know, cloud cost management is critical for operational excellence. Review our Kubernetes cluster configuration, identify nodes with CPU utilization under 15% over a 14-day rolling window, and recommend rightsizing strategies specifically for c5.2xlarge instances. Please provide estimated monthly savings in USD.',
  },
  {
    id: 'case-05-already-lean',
    name: 'Already Lean & Minimal',
    category: 'Coding',
    rawPrompt: 'Sort array of integers in ascending order in place using quicksort.',
  },
  {
    id: 'case-06-contradictory',
    name: 'Contradictory Constraints',
    category: 'Writing',
    rawPrompt: 'Explain quantum computing in exactly 10 words, and provide 5 detailed real-world examples with technical specifications.',
  },
];

export async function runBenchmark(options: {
  mode?: 'offline_mock' | 'live_api';
  iterations?: number;
  outputPath?: string;
}): Promise<BenchmarkReport> {
  const mode = options.mode || (process.env.BENCHMARK_LIVE === 'true' && config.GEMINI_API_KEY ? 'live_api' : 'offline_mock');
  const iterations = options.iterations || 3;

  let geminiService;
  if (mode === 'live_api') {
    geminiService = new GeminiService(config.GEMINI_API_KEY);
  } else {
    // Deterministic mock with simulated realistic processing delay (15ms local processing)
    geminiService = new FakeGeminiService(
      async (params) => {
        await new Promise((r) => setTimeout(r, 15));
        return {
          text: JSON.stringify({
            intentSummary: 'Benchmark optimization mock intent',
            taskCategory: 'Coding',
            detectedConstraints: {
              mustPreserve: ['core requirement'],
              outputFormat: 'JSON',
              lengthLimit: null,
              language: null,
              mustAvoid: [],
              exactLiterals: ['src/server/index.ts', 'npm run test:unit'],
            },
            highContext: `### Objective\n${params.contents}\n\n### Constraints\n- Preserve requirements`,
            lowToken: params.contents.replace(/please kindly|thank you/gi, '').trim(),
            warnings: [],
            recommendation: {
              variant: 'lowToken',
              reason: 'Removes unnecessary filler while preserving all requirements.',
            },
          }),
          usage: { promptTokens: 30, candidateTokens: 45, totalTokens: 75 },
        };
      },
      async (params) => {
        await new Promise((r) => setTimeout(r, 5));
        const words = params.contents.trim().split(/\s+/).filter(Boolean);
        return Math.max(1, Math.round(words.length * 1.3));
      }
    );
  }

  const optimizerService = new OptimizerService(geminiService);
  const executorService = new ExecutorService(geminiService);
  const app = createApp({
    geminiService,
    optimizerService,
    executorService,
    enableRateLimit: false,
  });

  const client = supertest(app);
  const caseResults: CaseLatencyMetrics[] = [];
  const allDurations: number[] = [];

  for (const testCase of BENCHMARK_CASES) {
    const durations: number[] = [];
    let lastResult: any = null;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await client
        .post('/api/optimize')
        .send({
          rawPrompt: testCase.rawPrompt,
          taskCategory: testCase.category,
        })
        .expect(200);

      const elapsed = performance.now() - start;
      durations.push(Number(elapsed.toFixed(2)));
      allDurations.push(Number(elapsed.toFixed(2)));
      lastResult = res.body.data;
    }

    durations.sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1];
    const avg = Number((durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2));

    caseResults.push({
      caseId: testCase.id,
      name: testCase.name,
      iterations,
      durationsMs: durations,
      p50Ms: p50,
      p95Ms: p95,
      minMs: durations[0],
      maxMs: durations[durations.length - 1],
      avgMs: avg,
      rawTokens: lastResult?.metrics?.rawTokens ?? null,
      highContextTokens: lastResult?.metrics?.highContextTokens ?? null,
      lowTokenTokens: lastResult?.metrics?.lowTokenTokens ?? null,
      tokenReductionPercent: lastResult?.metrics?.lowTokenReductionPercent ?? null,
      modelCallsPerRequest: mode === 'offline_mock' ? 4 : 4, // 1 generation + 3 token counts
    });
  }

  allDurations.sort((a, b) => a - b);
  const overallP50 = allDurations[Math.floor(allDurations.length * 0.5)];
  const overallP95 = allDurations[Math.floor(allDurations.length * 0.95)] || allDurations[allDurations.length - 1];
  const overallAvg = Number((allDurations.reduce((s, d) => s + d, 0) / allDurations.length).toFixed(2));

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    environment: `${process.platform} node-${process.version}`,
    mode,
    model: config.GEMINI_MODEL,
    totalCases: BENCHMARK_CASES.length,
    iterationsPerCase: iterations,
    summary: {
      overallP50Ms: overallP50,
      overallP95Ms: overallP95,
      overallAvgMs: overallAvg,
      minMs: allDurations[0],
      maxMs: allDurations[allDurations.length - 1],
      totalRequests: allDurations.length,
    },
    cases: caseResults,
  };

  const targetPath = options.outputPath || path.resolve(__dirname, 'results.json');
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(report, null, 2), 'utf8');

  return report;
}

// Direct execution CLI support
if (process.argv[1]?.endsWith('benchmark.ts') || process.argv[1]?.endsWith('benchmark.js')) {
  console.log('[Benchmark] Running performance benchmark harness...');
  runBenchmark({ iterations: 5 })
    .then((report) => {
      console.log(`[Benchmark] Completed ${report.summary.totalRequests} benchmark runs.`);
      console.log(`[Benchmark] Overall p50: ${report.summary.overallP50Ms}ms | p95: ${report.summary.overallP95Ms}ms | Avg: ${report.summary.overallAvgMs}ms`);
      console.log(`[Benchmark] Results written to server/tests/performance/results.json`);
    })
    .catch((err) => {
      console.error('[Benchmark] Error running benchmark:', err);
      process.exit(1);
    });
}
