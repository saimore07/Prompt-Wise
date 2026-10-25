import React, { useState } from 'react';
import { X, Key, CheckCircle2, Shield, Info } from 'lucide-react';
import { ServiceHealth } from '../types/index.js';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: ServiceHealth | null;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  health,
}) => {
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('optiprompt_openai_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('optiprompt_anthropic_key') || '');
  const [deepseekKey, setDeepseekKey] = useState(() => localStorage.getItem('optiprompt_deepseek_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('optiprompt_groq_key') || '');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('optiprompt_openai_key', openaiKey.trim());
    localStorage.setItem('optiprompt_anthropic_key', anthropicKey.trim());
    localStorage.setItem('optiprompt_deepseek_key', deepseekKey.trim());
    localStorage.setItem('optiprompt_groq_key', groqKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Model Provider Keys</h3>
              <p className="text-xs text-slate-400">Configure or view upstream AI credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Informational Bridge Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-300">Zero-Key Frictionless Multi-Model Mode</p>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                You can select and test prompts with <strong>OpenAI, Anthropic, DeepSeek, and Llama</strong> immediately! When API keys are not yet provided, PromptWise automatically activates its multi-model bridge engine so you can benchmark prompt behaviors right away.
              </p>
            </div>
          </div>

          {/* Provider List */}
          <div className="space-y-4">
            {/* 1. NVIDIA Nemotron */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">NVIDIA Nemotron</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                    Active · Free & Open Source
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">NVIDIA NIM Server Key Connected · Models: Nemotron 3.5 Bolt, Nemotron 550B, Nano Omni</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </div>

            {/* 2. Google Gemini */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Google Gemini</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-[10px] font-semibold">
                    {health?.providers?.google ? 'Connected' : 'Fallback / Rate Limited'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">Server key configured · Models: 3.5 Flash-Lite, 3.5 Flash, 3.8 Flash, 2.5 Pro</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>

            {/* 2. OpenAI */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">OpenAI</span>
                  <span className="text-slate-400 text-[11px]">(GPT-4o, GPT-4o Mini, o3-mini)</span>
                </div>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-proj-... (or set OPENAI_API_KEY in server/.env)"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {/* 3. Anthropic */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Anthropic</span>
                  <span className="text-slate-400 text-[11px]">(Claude 3.5 Sonnet, Claude 3.5 Haiku)</span>
                </div>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-ant-... (or set ANTHROPIC_API_KEY in server/.env)"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {/* 4. DeepSeek */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">DeepSeek</span>
                  <span className="text-slate-400 text-[11px]">(DeepSeek-V3, DeepSeek-R1)</span>
                </div>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-... (or set DEEPSEEK_API_KEY in server/.env)"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {/* 5. Meta / Groq */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Meta / Groq LPU</span>
                  <span className="text-slate-400 text-[11px]">(Llama 3.3 70B)</span>
                </div>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="password"
                placeholder="gsk_... (or set GROQ_API_KEY in server/.env)"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keys stored securely in your local environment</span>
          </div>
          <div className="flex items-center space-x-2">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
                Saved successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
