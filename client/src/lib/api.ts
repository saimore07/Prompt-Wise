import {
  ExecutionResult,
  OptimizationResult,
  ServiceHealth,
  TaskCategory,
} from '../types/index.js';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  public code: string;
  public details?: Array<{ field: string; message: string }>;
  public status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'API request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.details = payload.details;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    let message = json?.error?.message || json?.message;
    if (!message) {
      if (res.status === 404) {
        message = 'API endpoint not found (404). Please verify routing.';
      } else if (res.status === 503) {
        message = 'AI API key is not configured on the server (503). Please set NVIDIA_API_KEY or GEMINI_API_KEY in your Vercel project settings.';
      } else if (res.status === 504) {
        message = 'Gateway timeout (504). The AI model request timed out.';
      } else if (res.status >= 500) {
        message = `Server error (${res.status}). Check Vercel Function logs.`;
      } else {
        message = res.statusText || `Request failed with status ${res.status}`;
      }
    }
    const errorPayload: ApiErrorPayload = {
      code: json?.error?.code || `HTTP_${res.status}`,
      message,
      details: json?.error?.details,
    };
    console.error('[OptiPrompt API Error]', res.status, errorPayload);
    throw new ApiError(res.status, errorPayload);
  }
  return json.data !== undefined ? json.data : json;
}

export async function fetchHealth(signal?: AbortSignal): Promise<ServiceHealth> {
  const res = await fetch(`${API_BASE}/api/health`, { signal });
  return handleResponse<ServiceHealth>(res);
}

export interface StreamProgressStage {
  id: string;
  label: string;
  percent: number;
}

export async function optimizePrompt(
  params: {
    rawPrompt: string;
    taskCategory?: TaskCategory;
    model?: string;
    modelFamily?: string;
    tokenizerFamily?: string;
  },
  signal?: AbortSignal
): Promise<OptimizationResult> {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });
  return handleResponse<OptimizationResult>(res);
}

export async function optimizePromptStream(
  params: {
    rawPrompt: string;
    taskCategory?: TaskCategory;
    model?: string;
    modelFamily?: string;
    tokenizerFamily?: string;
  },
  onStage: (stage: StreamProgressStage) => void,
  signal?: AbortSignal
): Promise<OptimizationResult> {
  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ ...params, stream: true }),
    signal,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new ApiError(res.status, errorJson?.error || {
      code: `HTTP_${res.status}`,
      message: res.statusText || 'Optimization failed',
    });
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported by browser environment.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: OptimizationResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const chunk of lines) {
      if (!chunk.trim()) continue;

      let event = 'message';
      let dataStr = '';

      for (const line of chunk.split('\n')) {
        if (line.startsWith('event: ')) {
          event = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          dataStr = line.slice(6).trim();
        }
      }

      if (dataStr) {
        try {
          const parsedData = JSON.parse(dataStr);
          if (event === 'stage') {
            onStage(parsedData);
          } else if (event === 'complete') {
            finalResult = parsedData.data;
          } else if (event === 'error') {
            throw new Error(parsedData.error?.message || 'Streaming optimization failed');
          }
        } catch (e: any) {
          if (e.message && e.message !== 'Unexpected end of JSON input') {
            throw e;
          }
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error('Stream ended without receiving final optimization result.');
  }

  return finalResult;
}

export async function executePrompt(
  params: {
    prompt: string;
    model?: string;
    variantType?: 'original' | 'highContext' | 'lowToken' | 'custom';
  },
  signal?: AbortSignal
): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });
  return handleResponse<ExecutionResult>(res);
}

export async function submitFeedback(params: {
  requestId: string;
  variantType: 'original' | 'highContext' | 'lowToken' | 'custom';
  rating: 'helpful' | 'not_helpful';
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}
