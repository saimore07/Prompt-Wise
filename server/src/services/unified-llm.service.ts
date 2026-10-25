import { config } from '../config/env.js';
import {
  CountTokensParams,
  GeminiConfigError,
  GeminiRateLimitError,
  GenerateContentParams,
  GenerateContentResult,
  IGeminiService,
} from './gemini.service.js';
import { NemotronService } from './nemotron.service.js';

export class UnifiedLLMService implements IGeminiService {
  constructor(
    private geminiService: IGeminiService,
    private nemotronService: NemotronService
  ) {}

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const isNemotronModel =
      params.model.includes('nemotron') ||
      params.model.startsWith('nvidia/') ||
      params.model.includes('bolt');

    // If Nemotron is explicitly requested, or NVIDIA_API_KEY is configured and GEMINI_API_KEY is not
    if (
      isNemotronModel ||
      (config.NVIDIA_API_KEY && !config.GEMINI_API_KEY) ||
      (config.NVIDIA_API_KEY && config.DEFAULT_MODEL.includes('nemotron'))
    ) {
      try {
        return await this.nemotronService.generateContent(params);
      } catch (err: any) {
        console.warn(`[UnifiedLLMService] Nemotron error: ${err.message}. Attempting Gemini fallback if available...`);
        if (config.GEMINI_API_KEY) {
          return await this.geminiService.generateContent({
            ...params,
            model: 'gemini-3.5-flash-lite',
          });
        }
        throw err;
      }
    }

    // Otherwise, try Gemini with automatic fallback to Nemotron on quota/rate limit exhaustion or missing Gemini key
    try {
      return await this.geminiService.generateContent(params);
    } catch (err: any) {
      const isRateLimit =
        err instanceof GeminiRateLimitError ||
        err?.status === 429 ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('rate limit');

      const isConfigError =
        err instanceof GeminiConfigError ||
        String(err?.message || '').toLowerCase().includes('not configured');

      if ((isRateLimit || isConfigError) && config.NVIDIA_API_KEY) {
        console.warn(
          '[UnifiedLLMService] Gemini unavailable or not configured. Automatically routing to free open-source NVIDIA Nemotron...'
        );
        return await this.nemotronService.generateContent({
          ...params,
          model: 'nvidia/nemotron-3.5-bolt-e4b',
        });
      }
      throw err;
    }
  }

  async countTokens(params: CountTokensParams): Promise<number> {
    const isNemotronModel =
      params.model.includes('nemotron') ||
      params.model.startsWith('nvidia/') ||
      params.model.includes('bolt');

    if (
      isNemotronModel ||
      (config.NVIDIA_API_KEY && !config.GEMINI_API_KEY) ||
      (config.NVIDIA_API_KEY && config.DEFAULT_MODEL.includes('nemotron'))
    ) {
      return await this.nemotronService.countTokens(params);
    }

    try {
      return await this.geminiService.countTokens(params);
    } catch (err: any) {
      if (config.NVIDIA_API_KEY) {
        return await this.nemotronService.countTokens(params);
      }
      return Math.max(1, Math.ceil(params.contents.trim().length / 3.8));
    }
  }
}
