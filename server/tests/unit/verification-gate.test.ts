import { describe, expect, it } from 'vitest';
import { FakeGeminiService } from '../../src/services/gemini.service.js';
import { OptimizerService } from '../../src/services/optimizer.service.js';

describe('Verification Gate & Recommendation Fallback', () => {
  it('passes verification when all exact literals and hard requirements are preserved', () => {
    const optimizer = new OptimizerService(new FakeGeminiService());

    const rawPrompt = 'Debug src/server/index.ts and verify /^AIza[0-9]{10}$/';
    const constraints = {
      mustPreserve: ['Debug', 'verify'],
      outputFormat: null,
      lengthLimit: null,
      language: null,
      mustAvoid: [],
      exactLiterals: ['src/server/index.ts', '/^AIza[0-9]{10}$/'],
    };

    const variantGood = 'Please debug src/server/index.ts and verify /^AIza[0-9]{10}$/ carefully.';
    const result = optimizer.verifyVariant(variantGood, constraints, rawPrompt, 'lowToken');

    expect(result.passed).toBe(true);
    expect(result.exactLiteralsMissing).toHaveLength(0);
    expect(result.mustPreserveMissing).toHaveLength(0);
  });

  it('fails verification and lists missing literals when low-token variant drops an exact literal', () => {
    const optimizer = new OptimizerService(new FakeGeminiService());

    const rawPrompt = 'Debug src/server/index.ts and verify /^AIza[0-9]{10}$/';
    const constraints = {
      mustPreserve: ['Debug'],
      outputFormat: null,
      lengthLimit: null,
      language: null,
      mustAvoid: [],
      exactLiterals: ['src/server/index.ts', '/^AIza[0-9]{10}$/'],
    };

    // Low-token variant dropped the regex!
    const variantBad = 'Debug src/server/index.ts and verify the key format.';
    const result = optimizer.verifyVariant(variantBad, constraints, rawPrompt, 'lowToken');

    expect(result.passed).toBe(false);
    expect(result.exactLiteralsMissing).toContain('/^AIza[0-9]{10}$/');
  });

  it('fails verification when a prohibited negative constraint is violated (e.g. Markdown code fences introduced)', () => {
    const optimizer = new OptimizerService(new FakeGeminiService());

    const rawPrompt = 'Return valid JSON only. Do not use Markdown code fences.';
    const constraints = {
      mustPreserve: ['JSON'],
      outputFormat: 'JSON',
      lengthLimit: null,
      language: null,
      mustAvoid: ['Markdown code fences', 'markdown'],
      exactLiterals: [],
    };

    const variantViolating = '```json\n{"name": "test"}\n```';
    const result = optimizer.verifyVariant(variantViolating, constraints, rawPrompt, 'lowToken');

    expect(result.passed).toBe(false);
    expect(result.negativeConstraintsViolated.length).toBeGreaterThan(0);
  });

  it('automatically gates and flips recommendation to highContext when low-token fails verification', async () => {
    // Fake service where model erroneously recommends lowToken even though lowToken lost a literal
    const fakeGemini = new FakeGeminiService(async (params) => {
      return {
        text: JSON.stringify({
          intentSummary: 'Test intent',
          taskCategory: 'Coding',
          detectedConstraints: {
            mustPreserve: ['deploy to production'],
            outputFormat: null,
            lengthLimit: null,
            language: null,
            mustAvoid: [],
            exactLiterals: ['src/server/index.ts'],
          },
          // High-context kept the literal
          highContext: 'Objective: deploy to production\nTarget: src/server/index.ts',
          // Low-token dropped the literal!
          lowToken: 'Deploy to production immediately.',
          warnings: [],
          recommendation: {
            variant: 'lowToken',
            reason: 'Model prefers shortest text',
          },
        }),
      };
    });

    const optimizer = new OptimizerService(fakeGemini);
    const result = await optimizer.optimize({
      rawPrompt: 'Deploy src/server/index.ts to production.',
      requestId: 'test-verif-gate',
    });

    // Verification must have caught the dropped literal
    expect(result.verificationStatus?.lowToken.passed).toBe(false);
    expect(result.verificationStatus?.lowToken.exactLiteralsMissing).toContain('src/server/index.ts');
    expect(result.verificationStatus?.highContext.passed).toBe(true);

    // CRITICAL: Recommendation must have been reverted to highContext!
    expect(result.recommendation.variant).toBe('highContext');
    expect(result.recommendation.reason).toContain('Low-Token variant failed verification');
    expect(result.warnings.some((w) => w.code === 'VERIFICATION_GATE_REVERTED_RECOMMENDATION')).toBe(true);
  });

  it('programmatically detects unextracted hard constraints (regex and path) and triggers verification failure', () => {
    const optimizer = new OptimizerService(new FakeGeminiService());
    const rawPrompt = 'Run tests in tests/unit/api.test.ts with pattern /^AIza[0-9]{10}$/ and keep under 50 words.';

    // Even if detectedConstraints from LLM missed the regex, programmatic check catches it
    const emptyConstraints = {
      mustPreserve: [],
      outputFormat: null,
      lengthLimit: null,
      language: null,
      mustAvoid: [],
      exactLiterals: [],
    };

    // Low-token text dropped the regex!
    const droppedVariant = 'Run tests in tests/unit/api.test.ts under 50 words.';
    const check = optimizer.verifyVariant(droppedVariant, emptyConstraints, rawPrompt, 'lowToken');

    expect(check.passed).toBe(false);
    expect(check.exactLiteralsMissing).toContain('/^AIza[0-9]{10}$/');
  });
});
