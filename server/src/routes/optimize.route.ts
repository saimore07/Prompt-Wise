import { NextFunction, Request, Response, Router } from 'express';
import { OptimizationRequestSchema } from '../schemas/optimization.schema.js';
import { OptimizerService } from '../services/optimizer.service.js';

export function createOptimizeRouter(optimizerService: OptimizerService): Router {
  const router = Router();

  const handleOptimizeRequest = async (req: Request, res: Response, next: NextFunction, forceStream = false) => {
    try {
      const parsed = OptimizationRequestSchema.parse(req.body);
      const requestId = req.id || 'req_' + Date.now();
      const isStream =
        forceStream ||
        parsed.stream === true ||
        req.query.stream === 'true' ||
        req.headers.accept === 'text/event-stream';

      if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const sendEvent = (event: string, data: any) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        try {
          const result = await optimizerService.optimize({
            rawPrompt: parsed.rawPrompt,
            taskCategory: parsed.taskCategory,
            model: parsed.model,
            modelFamily: parsed.modelFamily,
            tokenizerFamily: parsed.tokenizerFamily,
            requestId,
            onProgress: (stage) => {
              sendEvent('stage', stage);
            },
          });

          sendEvent('complete', { success: true, data: result });
          res.end();
        } catch (streamErr: any) {
          sendEvent('error', {
            success: false,
            error: {
              code: streamErr.code || 'OPTIMIZATION_ERROR',
              message: streamErr.message || 'Stream processing failed',
            },
          });
          res.end();
        }
        return;
      }

      const result = await optimizerService.optimize({
        rawPrompt: parsed.rawPrompt,
        taskCategory: parsed.taskCategory,
        model: parsed.model,
        modelFamily: parsed.modelFamily,
        tokenizerFamily: parsed.tokenizerFamily,
        requestId,
      });

      if (result.timings) {
        res.setHeader(
          'Server-Timing',
          `total;dur=${result.timings.totalMs}, gen;dur=${result.timings.analysisAndGenerationMs}, tok;dur=${result.timings.tokenCountingMs}, verif;dur=${result.timings.verificationMs}`
        );
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  router.post('/optimize', (req, res, next) => handleOptimizeRequest(req, res, next, false));
  router.post('/optimize/stream', (req, res, next) => handleOptimizeRequest(req, res, next, true));
  router.post('/arbitrage', (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawTokens = typeof req.body?.rawTokens === 'number' ? req.body.rawTokens : null;
      const lowTokens = typeof req.body?.lowTokens === 'number' ? req.body.lowTokens : null;
      const arbitrageMetrics = optimizerService.calculateCostArbitrage(rawTokens, lowTokens);
      res.json({
        success: true,
        data: arbitrageMetrics,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
