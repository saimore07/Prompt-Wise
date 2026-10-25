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

export async function optimizePrompt(
  params: {
    rawPrompt: string;
    taskCategory?: TaskCategory;
    model?: string;
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
