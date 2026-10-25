import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env.js';
import {
  GeminiConfigError,
  GeminiProviderError,
  GeminiRateLimitError,
} from '../services/gemini.service.js';

function sanitizeMessage(msg: string): string {
  let clean = msg;
  // Mask known server API key
  if (config.GEMINI_API_KEY) {
    clean = clean.split(config.GEMINI_API_KEY).join('[REDACTED_API_KEY]');
  }
  // Mask Google API key patterns (AIzaSy...)
  clean = clean.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
  // Mask generic key or token query params / headers
  clean = clean.replace(/(key|token|auth)=[a-zA-Z0-9_\-\.]+/gi, '$1=[REDACTED]');
  return clean;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const reqId = req.id || 'unknown';
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred.';
  let details: any = undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed.';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: sanitizeMessage(e.message),
    }));
  } else if (
    err instanceof GeminiConfigError ||
    (err?.message && String(err.message).toLowerCase().includes('api key is not configured'))
  ) {
    statusCode = 503;
    code = 'CONFIG_ERROR';
    message = 'AI API key is not configured on the server. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment variables.';
  } else if (err instanceof GeminiRateLimitError) {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'The AI provider rate limit was exceeded. Please retry in a few moments.';
  } else if (err instanceof GeminiProviderError) {
    statusCode = err.statusCode || 502;
    code = 'PROVIDER_ERROR';
    if (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE'))) {
      message = 'The Gemini model is temporarily experiencing high demand on Google\'s servers. Please retry in a few moments.';
    } else if (err.message && err.message.includes('timed out')) {
      message = 'The AI request timed out due to high network latency. Please retry.';
    } else {
      message = 'The AI provider returned an error processing your request. Please try again.';
    }
  } else if (err?.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds the maximum permitted size.';
  } else {
    // Generic unhandled internal server error: DO NOT leak internal error text to the client
    statusCode = 500;
    code = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected server error occurred.';
  }

  // Safe logging: log sanitized summary without exposing secrets or raw sensitive input
  const safeLogMsg = sanitizeMessage(err?.message || 'Unknown error');
  console.error(`[ERROR] reqId=${reqId} path=${req.path} code=${code} status=${statusCode} msg=${safeLogMsg}`);

  res.status(statusCode).json({
    success: false,
    requestId: reqId,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
};
