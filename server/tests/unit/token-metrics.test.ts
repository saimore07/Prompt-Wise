import { describe, expect, it } from 'vitest';
import { FakeGeminiService } from '../../src/services/gemini.service.js';
import { TokenMetricsService } from '../../src/services/token-metrics.service.js';

describe('TokenMetricsService Unit Tests', () => {
  const fakeService = new FakeGeminiService();
  const service = new TokenMetricsService(fakeService);

  // Case 4: Token reduction calculation (100 -> 70 = 30% reduction)
  it('Case 04: calculates exact 30% reduction when tokens drop from 100 to 70', () => {
    const reduction = service.calculateReductionPercent(100, 70);
    expect(reduction).toBe(30.0);
  });

  // Case 5: Token increase calculation (100 -> 120 = signed -20% reduction / 20% increase)
  it('Case 05: calculates signed change for token increase (100 to 120 gives -20% reduction)', () => {
    const reduction = service.calculateReductionPercent(100, 120);
    expect(reduction).toBe(-20.0);

    const change = service.calculateChangePercent(100, 120);
    expect(change).toBe(20.0);
  });

  // Case 6: Zero original tokens - safe division, returns null (no NaN or Infinity)
  it('Case 06: returns null and does not divide by zero or emit NaN/Infinity when rawTokens is 0', () => {
    const reduction = service.calculateReductionPercent(0, 50);
    expect(reduction).toBeNull();

    const change = service.calculateChangePercent(0, 50);
    expect(change).toBeNull();

    const nullRaw = service.calculateReductionPercent(null, 50);
    expect(nullRaw).toBeNull();
  });

  // Case 7: Token-count API failure: sets counts to null and emits clear warning
  it('Case 07: sets token count to null and emits warning if Gemini API token count fails', async () => {
    const failingService = new FakeGeminiService(
      undefined,
      async (params) => {
        if (params.contents.includes('fail_me')) {
          throw new Error('Gemini tokenizer quota exceeded');
        }
        return 42;
      }
    );
    const metricsService = new TokenMetricsService(failingService);

    const result = await metricsService.countAllTokens({
      model: 'gemini-2.5-flash',
      rawPrompt: 'Hello world',
      highContext: 'fail_me context',
      lowToken: 'Hello',
    });

    expect(result.rawTokens).toBe(42);
    expect(result.highContextTokens).toBeNull();
    expect(result.lowTokenTokens).toBe(42);
    expect(result.warnings.some((w) => w.code === 'TOKEN_COUNT_HIGH_FAILED')).toBe(true);
  });

  // Case 21: Concurrent token counting: counts remain properly mapped to respective prompts
  it('Case 21: counts all 3 prompts concurrently without swapping values', async () => {
    const mappingService = new FakeGeminiService(
      undefined,
      async (params) => {
        if (params.contents === 'PROMPT_RAW') return 100;
        if (params.contents === 'PROMPT_HIGH') return 150;
        if (params.contents === 'PROMPT_LOW') return 60;
        return 0;
      }
    );
    const metricsService = new TokenMetricsService(mappingService);

    const result = await metricsService.countAllTokens({
      model: 'gemini-2.5-flash',
      rawPrompt: 'PROMPT_RAW',
      highContext: 'PROMPT_HIGH',
      lowToken: 'PROMPT_LOW',
    });

    expect(result.rawTokens).toBe(100);
    expect(result.highContextTokens).toBe(150);
    expect(result.lowTokenTokens).toBe(60);

    const metrics = metricsService.computeMetrics(result, 'gemini-2.5-flash');
    expect(metrics.lowTokenReductionPercent).toBe(40.0);
    expect(metrics.highContextChangePercent).toBe(50.0);
    expect(metrics.costEstimate?.inputCost).toBeGreaterThan(0);
    expect(metrics.costEstimate?.isEstimate).toBe(true);
  });

  // Dynamic Tokenizer Switching: OpenAI o200k, cl100k, Claude 3, Llama 3
  it('dynamically switches tokenizer logic based on requested model family', async () => {
    const metricsService = new TokenMetricsService(new FakeGeminiService());

    const testPrompt = 'Calculate the discrete Fourier transform of a 1024-point real signal.';

    // OpenAI o200k
    const o200kCount = await metricsService.countSingleWithCache('gpt-4o', testPrompt, 'openai-o200k');
    expect(o200kCount).toBeGreaterThan(0);

    // OpenAI cl100k
    const cl100kCount = await metricsService.countSingleWithCache('gpt-4', testPrompt, 'openai-cl100k');
    expect(cl100kCount).toBeGreaterThan(0);

    // Llama 3 / Nemotron
    const llamaCount = await metricsService.countSingleWithCache('nvidia/nemotron-3.5-bolt-e4b', testPrompt, 'llama3-nemotron');
    expect(llamaCount).toBeGreaterThan(0);

    // Test computeMetrics reflects chosen tokenizer family
    const counts = { rawTokens: o200kCount, highContextTokens: o200kCount + 10, lowTokenTokens: o200kCount - 5 };
    const metrics = metricsService.computeMetrics(counts, 'gpt-4o', 'Coding', null, 'openai-o200k');
    expect(metrics.tokenizerFamily).toBe('openai-o200k');
    expect(metrics.measuredWith).toContain('o200k_base');
  });
});
