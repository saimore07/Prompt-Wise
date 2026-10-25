import React, { useState } from 'react';
import { X, Check, Cpu, Zap, Brain, Sparkles, Layers, Binary } from 'lucide-react';
import { ModelInfo, SUPPORTED_MODELS } from '../lib/models.js';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');

  if (!isOpen) return null;

  const familyFilters = [
    { id: 'all', label: 'All Families' },
    { id: 'openai-o200k', label: 'OpenAI o200k' },
    { id: 'openai-cl100k', label: 'OpenAI cl100k' },
    { id: 'anthropic-claude', label: 'Anthropic Claude 3' },
    { id: 'llama3-nemotron', label: 'Llama 3 / Nemotron' },
    { id: 'google-gemini', label: 'Google Gemini' },
  ];

  const providers = [
    { key: 'nvidia', name: 'NVIDIA Nemotron (Free & Open Source - Active)', icon: Zap, color: 'emerald' },
    { key: 'google', name: 'Google Gemini', icon: Sparkles, color: 'emerald' },
    { key: 'openai', name: 'OpenAI', icon: Brain, color: 'blue' },
    { key: 'anthropic', name: 'Anthropic Claude', icon: Layers, color: 'amber' },
    { key: 'deepseek', name: 'DeepSeek', icon: Cpu, color: 'indigo' },
    { key: 'meta', name: 'Meta / Groq', icon: Zap, color: 'purple' },
  ];

  const getModelTokenizerBadge = (model: ModelInfo): { label: string; color: string } => {
    const id = model.id.toLowerCase();
    if (id.includes('o200k') || id.includes('gpt-4o') || id.startsWith('o1') || id.startsWith('o3')) {
      return { label: 'o200k_base', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    if (id.includes('cl100k') || id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('deepseek')) {
      return { label: 'cl100k_base', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
    if (id.includes('claude')) {
      return { label: 'Claude BPE', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (id.includes('llama') || id.includes('nemotron') || id.startsWith('nvidia/')) {
      return { label: '128k BPE', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    return { label: 'Gemini Native', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
  };

  const matchesFamilyFilter = (model: ModelInfo): boolean => {
    if (selectedFamilyFilter === 'all') return true;
    const id = model.id.toLowerCase();
    if (selectedFamilyFilter === 'openai-o200k') {
      return id.includes('o200k') || id.includes('gpt-4o') || id.startsWith('o1') || id.startsWith('o3');
    }
    if (selectedFamilyFilter === 'openai-cl100k') {
      return id.includes('cl100k') || id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('deepseek');
    }
    if (selectedFamilyFilter === 'anthropic-claude') {
      return id.includes('claude');
    }
    if (selectedFamilyFilter === 'llama3-nemotron') {
      return id.includes('llama') || id.includes('nemotron') || id.startsWith('nvidia/');
    }
    if (selectedFamilyFilter === 'google-gemini') {
      return id.includes('gemini');
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select AI Model & Tokenizer Family</h3>
              <p className="text-xs text-slate-400">Choose your optimization target model and dynamic tokenizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Family Filter Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/30 flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center text-slate-400 mr-1 text-[11px] font-medium">
            <Binary className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>Filter:</span>
          </div>
          {familyFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFamilyFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                selectedFamilyFilter === f.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Grouped by Provider */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {providers.map((p) => {
            const models = SUPPORTED_MODELS.filter((m) => m.provider === p.key && matchesFamilyFilter(m));
            if (models.length === 0) return null;

            return (
              <div key={p.key} className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <p.icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {models.map((model: ModelInfo) => {
                    const isSelected = selectedModel === model.id;
                    const tokenizerBadge = getModelTokenizerBadge(model);

                    return (
                      <div
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          onClose();
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-white text-xs block">{model.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{model.id}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                          {model.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px] gap-2">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-medium truncate">
                              {model.badge}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-medium flex-shrink-0 ${tokenizerBadge.color}`}>
                              {tokenizerBadge.label}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px] flex-shrink-0">
                            {model.inputPrice}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Active Selection: <strong className="text-emerald-400 font-mono">{selectedModel}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
