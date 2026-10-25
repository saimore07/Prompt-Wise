import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { FakeGeminiService, GeminiService, IGeminiService } from '../services/gemini.service.js';
import { OptimizerService } from '../services/optimizer.service.js';
import { GoldenCase, GoldenEvaluator } from './evaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');

  console.log('====================================================');
  console.log(`[OptiPrompt Evaluator] Running mode: ${isLive ? 'LIVE GEMINI' : 'OFFLINE GOLDEN FIXTURES'}`);
  console.log('====================================================');

  const casesPath = path.join(__dirname, 'golden-cases.json');
  if (!fs.existsSync(casesPath)) {
    console.error(`Golden cases file not found at ${casesPath}`);
    process.exit(1);
  }

  const cases: GoldenCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
  console.log(`Loaded ${cases.length} golden test cases.`);

  let geminiService: IGeminiService;

  if (isLive) {
    if (!config.GEMINI_API_KEY) {
      console.error('ERROR: Live evaluation requires GEMINI_API_KEY environment variable.');
      process.exit(1);
    }
    if (!config.RUN_LIVE_LLM_EVALS) {
      console.warn('WARNING: RUN_LIVE_LLM_EVALS is false in .env. Proceeding because --live flag was explicitly supplied.');
    }
    console.log(`Using live Gemini service with model: ${config.GEMINI_MODEL}`);
    geminiService = new GeminiService(config.GEMINI_API_KEY);
  } else {
    // Offline mode: map golden cases mock responses into FakeGeminiService
    const mockMap = new Map<string, any>();
    for (const c of cases) {
      if (c.mockResponse) {
        mockMap.set(c.rawPrompt.trim(), c.mockResponse);
      }
    }

    geminiService = new FakeGeminiService(
      async (params) => {
        // Find matching prompt
        for (const [raw, mock] of mockMap.entries()) {
          if (params.contents.includes(raw)) {
            return {
              text: JSON.stringify(mock),
              usage: { promptTokens: 50, candidateTokens: 60, totalTokens: 110 },
            };
          }
        }
        // Fallback default
        return {
          text: JSON.stringify({
            intentSummary: 'General intent',
            taskCategory: 'General',
            detectedConstraints: { mustPreserve: [], outputFormat: null, lengthLimit: null, language: null, mustAvoid: [], exactLiterals: [] },
            highContext: params.contents,
            lowToken: params.contents,
            warnings: [],
            recommendation: { variant: 'lowToken', reason: 'Default fallback' },
          }),
        };
      },
      async (params) => {
        // Native token count simulator: deterministic word count approximation
        const words = params.contents.trim().split(/\s+/).filter(Boolean);
        return Math.max(1, Math.round(words.length * 1.3));
      }
    );
  }

  const optimizer = new OptimizerService(geminiService);
  const evaluator = new GoldenEvaluator();

  /**
   * Concurrency Limiter: Caps maximum parallel API invocations to 3.
   */
  class ConcurrencyLimiter {
    private active = 0;
    private queue: Array<() => void> = [];

    constructor(private maxConcurrent: number) {}

    async run<T>(fn: () => Promise<T>): Promise<T> {
      if (this.active >= this.maxConcurrent) {
        await new Promise<void>((resolve) => this.queue.push(resolve));
      }
      this.active++;
      try {
        return await fn();
      } finally {
        this.active--;
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  /**
   * Exponential backoff retry handler for 429 Too Many Requests / Quota Exceeded.
   */
  async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    caseId: string,
    maxRetries = 4,
    baseDelayMs = 1500
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.statusCode === 429 ||
          err?.name === 'GeminiRateLimitError' ||
          String(err?.message || '').includes('429') ||
          String(err?.message || '').toLowerCase().includes('quota') ||
          String(err?.message || '').toLowerCase().includes('rate limit');

        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const jitter = Math.floor(Math.random() * 600);
          const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
          console.warn(
            `\n[RateLimitBackoff] Case ${caseId} encountered 429 rate limit. Backing off for ${(delayMs / 1000).toFixed(2)}s (attempt ${attempt}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Exceeded max retries for case ${caseId}`);
  }

  const limiter = new ConcurrencyLimiter(3);
  console.log(`Starting evaluations with concurrency pool of 3 and exponential backoff retry for 429 errors...\n`);

  const results: any[] = new Array(cases.length);

  const evalPromises = cases.map((c, i) =>
    limiter.run(async () => {
      process.stdout.write(`Evaluating [${i + 1}/${cases.length}] ${c.id}: ${c.name}... `);

      try {
        const optimizationResult = await retryWithExponentialBackoff(
          () =>
            optimizer.optimize({
              rawPrompt: c.rawPrompt,
              requestId: `eval_${c.id}`,
            }),
          c.id
        );

        const score = evaluator.evaluateCase(c, optimizationResult);
        results[i] = score;
        console.log(score.passed ? 'PASSED' : 'FAILED');
        if (!score.passed) {
          console.log(`   Failure reason(s): ${score.failureReasons.join(', ')}`);
        }
      } catch (err: any) {
        console.log('ERROR');
        console.error(`   Execution error on case ${c.id}: ${err.message}`);
        results[i] = {
          caseId: c.id,
          category: c.category,
          name: c.name,
          intentPreservation: 0,
          constraintPreservation: 0,
          clarityAndUsability: 0,
          compressionEfficiency: 0,
          unsupportedAdditionsCount: 0,
          formatInvariantPassed: false,
          literalInvariantsPassed: false,
          warningsDetected: [],
          tokenMetrics: { rawTokens: null, highContextTokens: null, lowTokenTokens: null, lowTokenReductionPercent: null },
          passed: false,
          failureReasons: [`Runtime error: ${err.message}`],
        };
      }
    })
  );

  await Promise.all(evalPromises);

  const report = evaluator.generateReport(results, config.GEMINI_MODEL, isLive ? 'live_gemini' : 'offline_fixture');
  const reportsDir = path.resolve(process.cwd(), 'evaluation_reports');
  const { jsonPath, mdPath } = evaluator.saveReportFiles(report, reportsDir);

  console.log('\n====================================================');
  console.log(`Evaluation Completed: ${report.passedCases}/${report.totalCases} cases passed.`);
  console.log(`Reports saved:`);
  console.log(`- Markdown: ${mdPath}`);
  console.log(`- JSON:     ${jsonPath}`);
  console.log('====================================================\n');

  if (report.failedCases > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal evaluator error:', err);
  process.exit(1);
});
