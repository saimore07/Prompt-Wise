import { Request, Response, Router } from 'express';
import { config } from '../config/env.js';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PromptWise API',
      model: config.DEFAULT_MODEL || 'nvidia/nemotron-3.5-bolt-e4b',
      hasApiKey: Boolean(
        (config.NVIDIA_API_KEY && config.NVIDIA_API_KEY.length > 5) ||
        (config.GEMINI_API_KEY && config.GEMINI_API_KEY.length > 5)
      ),
      allowedModels: config.ALLOWED_MODELS,
      providers: {
        nvidia: Boolean(config.NVIDIA_API_KEY && config.NVIDIA_API_KEY.length > 5),
        google: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.length > 5),
        openai: Boolean(config.OPENAI_API_KEY),
        anthropic: Boolean(config.ANTHROPIC_API_KEY),
        deepseek: Boolean(config.DEEPSEEK_API_KEY),
        groq: Boolean(config.GROQ_API_KEY),
      },
      historyEnabled: config.ENABLE_PROMPT_HISTORY,
      version: '1.4.0',
    });
  });

  return router;
}
