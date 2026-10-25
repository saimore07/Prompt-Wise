import { TokenizerFamily } from '../types/index.js';

export interface TokenizerFamilyInfo {
  id: TokenizerFamily;
  name: string;
  description: string;
  badge: string;
  encoding: string;
  defaultModel: string;
}

export const TOKENIZER_FAMILIES: TokenizerFamilyInfo[] = [
  {
    id: 'openai-o200k',
    name: 'OpenAI o200k (GPT-4o, o1, o3)',
    description: 'Modern 200k BPE tokenizer with exceptional token density for multilingual & code.',
    badge: 'o200k_base',
    encoding: 'o200k_base',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'openai-cl100k',
    name: 'OpenAI cl100k (GPT-4, GPT-3.5)',
    description: 'Standard 100k BPE vocabulary tokenizer for GPT-4 and classic LLM pipelines.',
    badge: 'cl100k_base',
    encoding: 'cl100k_base',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude 3 / 3.5',
    description: 'Byte-pair tokenizer calibrated for Claude 3.5 Sonnet and Haiku context density.',
    badge: 'Claude BPE',
    encoding: 'claude_bpe',
    defaultModel: 'claude-3-5-sonnet',
  },
  {
    id: 'llama3-nemotron',
    name: 'Meta Llama 3 / NVIDIA Nemotron',
    description: '128k BPE vocabulary optimized for open-source high-throughput inference.',
    badge: '128k BPE',
    encoding: 'llama3_128k',
    defaultModel: 'nvidia/nemotron-3.5-bolt-e4b',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google native tokenization engine with fine-grained multimodal alignment.',
    badge: 'Gemini Native',
    encoding: 'gemini_native',
    defaultModel: 'gemini-3.5-flash-lite',
  },
];

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'nvidia' | 'google' | 'openai' | 'anthropic' | 'deepseek' | 'meta';
  providerName: string;
  description: string;
  badge: string;
  latencyTier: 'Ultra-Fast' | 'Fast' | 'Reasoning' | 'Deep Analysis';
  inputPrice: string;
  outputPrice: string;
  tokenizerFamily?: TokenizerFamily;
  modelFamily?: string;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  // NVIDIA Nemotron (Free & Open Source - Active)
  {
    id: 'nvidia/nemotron-3.5-bolt-e4b',
    name: 'Nemotron 3.5 Bolt (NVIDIA)',
    provider: 'nvidia',
    providerName: 'NVIDIA Nemotron',
    description: 'Ultra-fast open-source model with instant execution and zero rate limit bounds.',
    badge: '⚡ Active',
    latencyTier: 'Ultra-Fast',
    inputPrice: 'Free',
    outputPrice: 'Free',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'nvidia',
    providerName: 'NVIDIA Nemotron',
    description: 'Massive 550B parameter open-weights flagship for nuanced, multi-constraint tasks.',
    badge: '🧠 550B Flagship',
    latencyTier: 'Deep Analysis',
    inputPrice: 'Free',
    outputPrice: 'Free',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron Nano Omni 30B',
    provider: 'nvidia',
    providerName: 'NVIDIA Nemotron',
    description: 'Lightweight reasoning-focused open architecture model.',
    badge: '🔬 Reasoning',
    latencyTier: 'Reasoning',
    inputPrice: 'Free',
    outputPrice: 'Free',
  },
  // Google Gemini
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'google',
    providerName: 'Google Gemini',
    description: 'Sub-second response, minimal latency, optimal token compression.',
    badge: '⚡ Ultra-Fast',
    latencyTier: 'Ultra-Fast',
    inputPrice: '$0.075 / 1M',
    outputPrice: '$0.30 / 1M',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    providerName: 'Google Gemini',
    description: 'High throughput and low latency for production workflows.',
    badge: '🚀 Balanced Speed',
    latencyTier: 'Fast',
    inputPrice: '$0.075 / 1M',
    outputPrice: '$0.30 / 1M',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    providerName: 'Google Gemini',
    description: 'Advanced reasoning capacity for multi-constraint instructions.',
    badge: '🧠 High Reasoning',
    latencyTier: 'Reasoning',
    inputPrice: '$0.075 / 1M',
    outputPrice: '$0.30 / 1M',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    providerName: 'Google Gemini',
    description: 'Deep context reasoning and precision for highly complex code.',
    badge: '🔬 Deep Analysis',
    latencyTier: 'Deep Analysis',
    inputPrice: '$1.25 / 1M',
    outputPrice: '$5.00 / 1M',
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'openai',
    providerName: 'OpenAI',
    description: 'High-intelligence flagship model with multimodal understanding.',
    badge: '🌟 Flagship Tier',
    latencyTier: 'Fast',
    inputPrice: '$2.50 / 1M',
    outputPrice: '$10.00 / 1M',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    providerName: 'OpenAI',
    description: 'Lightweight model engineered for speed and cost efficiency.',
    badge: '💸 Cost-Efficient',
    latencyTier: 'Fast',
    inputPrice: '$0.15 / 1M',
    outputPrice: '$0.60 / 1M',
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    providerName: 'OpenAI',
    description: 'Reasoning model specialized in math, coding, and logical tasks.',
    badge: '🧠 Reasoning Tier',
    latencyTier: 'Reasoning',
    inputPrice: '$1.10 / 1M',
    outputPrice: '$4.40 / 1M',
  },
  // Anthropic
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    description: 'Industry benchmark for code generation and nuanced writing.',
    badge: '💎 Premium Code',
    latencyTier: 'Fast',
    inputPrice: '$3.00 / 1M',
    outputPrice: '$15.00 / 1M',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    providerName: 'Anthropic',
    description: 'Rapid responses with strong adherence to structured schemas.',
    badge: '⚡ Sub-Second',
    latencyTier: 'Ultra-Fast',
    inputPrice: '$0.80 / 1M',
    outputPrice: '$4.00 / 1M',
  },
  // DeepSeek
  {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    description: 'Top-tier open mixture-of-experts model with outstanding economics.',
    badge: '🔥 671B MoE',
    latencyTier: 'Fast',
    inputPrice: '$0.14 / 1M',
    outputPrice: '$0.28 / 1M',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    description: 'Open reasoning model using large-scale RL chain-of-thought.',
    badge: '🧠 Open Reasoning',
    latencyTier: 'Reasoning',
    inputPrice: '$0.55 / 1M',
    outputPrice: '$2.19 / 1M',
  },
  // Meta
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    providerName: 'Meta / Groq',
    description: 'Open-weights flagship running via ultra-fast LPU inference.',
    badge: '⚡ Ultra-High Speed',
    latencyTier: 'Ultra-Fast',
    inputPrice: '$0.59 / 1M',
    outputPrice: '$0.79 / 1M',
  },
];

export function getModelInfo(modelId?: string): ModelInfo | undefined {
  if (!modelId) return undefined;
  return SUPPORTED_MODELS.find(
    (m) => m.id.toLowerCase() === modelId.toLowerCase()
  );
}

export function getModelDisplayName(modelId?: string): {
  name: string;
  providerName: string;
  badge: string;
  id: string;
} {
  if (!modelId) {
    return {
      name: 'Nemotron 3.5 Bolt',
      providerName: 'NVIDIA Nemotron',
      badge: '⚡ NVIDIA Open Source',
      id: 'nvidia/nemotron-3.5-bolt-e4b',
    };
  }

  const match = getModelInfo(modelId);
  if (match) {
    return {
      name: match.name,
      providerName: match.providerName,
      badge: match.badge,
      id: match.id,
    };
  }

  if (modelId.includes('nemotron') || modelId.startsWith('nvidia/')) {
    return {
      name: 'Nemotron 3.5 Bolt (NVIDIA)',
      providerName: 'NVIDIA Nemotron',
      badge: '⚡ Active · Free & Open-Source',
      id: modelId,
    };
  }
  if (modelId.includes('gemini')) {
    return {
      name: modelId,
      providerName: 'Google Gemini',
      badge: 'Google AI',
      id: modelId,
    };
  }
  if (modelId.includes('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
    return {
      name: modelId,
      providerName: 'OpenAI',
      badge: 'OpenAI',
      id: modelId,
    };
  }
  if (modelId.includes('claude')) {
    return {
      name: modelId,
      providerName: 'Anthropic',
      badge: 'Anthropic',
      id: modelId,
    };
  }
  if (modelId.includes('deepseek')) {
    return {
      name: modelId,
      providerName: 'DeepSeek',
      badge: 'DeepSeek',
      id: modelId,
    };
  }
  if (modelId.includes('llama')) {
    return {
      name: modelId,
      providerName: 'Meta / Groq',
      badge: 'Meta',
      id: modelId,
    };
  }

  return {
    name: modelId,
    providerName: 'AI Engine',
    badge: 'AI Model',
    id: modelId,
  };
}
