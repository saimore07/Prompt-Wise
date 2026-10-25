import cors from 'cors';
import express, { Express } from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { createExecuteRouter } from './routes/execute.route.js';
import { createFeedbackRouter } from './routes/feedback.route.js';
import { createHealthRouter } from './routes/health.route.js';
import { createOptimizeRouter } from './routes/optimize.route.js';
import { ExecutorService } from './services/executor.service.js';
import { GeminiService, IGeminiService } from './services/gemini.service.js';
import { OptimizerService } from './services/optimizer.service.js';

import { NemotronService } from './services/nemotron.service.js';
import { UnifiedLLMService } from './services/unified-llm.service.js';

export interface AppDependencies {
  geminiService?: IGeminiService;
  optimizerService?: OptimizerService;
  executorService?: ExecutorService;
  enableRateLimit?: boolean;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  const llmService =
    deps.geminiService ||
    new UnifiedLLMService(new GeminiService(), new NemotronService());
  const optimizer = deps.optimizerService || new OptimizerService(llmService);
  const executor = deps.executorService || new ExecutorService(llmService);

  // Security & standard headers
  app.disable('x-powered-by');

  // CORS - Support local dev on any port, Vercel domains, and configured origin
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.vercel.app') ||
          origin === config.CLIENT_ORIGIN ||
          process.env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['Server-Timing', 'X-Request-Id'],
      credentials: true,
    })
  );

  // Body parser with size limit
  app.use(express.json({ limit: '1mb' }));

  // Tracing middleware
  app.use(requestIdMiddleware);

  // Rate Limiting (can be bypassed in unit tests if needed)
  if (deps.enableRateLimit !== false) {
    app.use(['/api', '/'], apiRateLimiter);
  }

  // Mount API routes (supports both /api and root mounts for serverless / custom proxies)
  const apiRouter = express.Router();
  apiRouter.use(createHealthRouter());
  apiRouter.use(createOptimizeRouter(optimizer));
  apiRouter.use(createExecuteRouter(executor));
  apiRouter.use(createFeedbackRouter());

  app.use('/api', apiRouter);
  app.use(apiRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
