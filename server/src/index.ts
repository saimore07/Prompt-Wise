import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`[PromptWise Server] Running on http://localhost:${config.PORT}`);
  console.log(`[PromptWise Server] Configured Default Model: ${config.DEFAULT_MODEL || config.GEMINI_MODEL}`);
  console.log(`[PromptWise Server] NVIDIA Nemotron API Key Configured: ${Boolean(config.NVIDIA_API_KEY)}`);
  console.log(`[PromptWise Server] Gemini API Key Configured: ${Boolean(config.GEMINI_API_KEY)}`);
  console.log(`[PromptWise Server] History Persistence: ${config.ENABLE_PROMPT_HISTORY ? 'Enabled' : 'Disabled (No-DB MVP)'}`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`[PromptWise Server] Received ${signal}, gracefully shutting down...`);
  server.close(() => {
    console.log('[PromptWise Server] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds if still hanging
  setTimeout(() => {
    console.error('[PromptWise Server] Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
