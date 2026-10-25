import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Sparkles, Zap, Shield, Square } from 'lucide-react';
import { ConstraintBadges } from './components/ConstraintBadges.js';
import { ExecutionOutputPanel } from './components/ExecutionOutputPanel.js';
import { Header } from './components/Header.js';
import { PromptInputPanel } from './components/PromptInputPanel.js';
import { TokenComparisonBar } from './components/TokenComparisonBar.js';
import { VariantColumn } from './components/VariantColumn.js';
import { WarningsBanner } from './components/WarningsBanner.js';
import { WarningBanner } from './components/WarningBanner.js';
import { CostArbitrageTable } from './components/CostArbitrageTable.js';
import { executePrompt, fetchHealth, optimizePrompt, optimizePromptStream } from './lib/api.js';
import { getModelDisplayName } from './lib/models.js';
import {
  ExecutionResult,
  OptimizationResult,
  ServiceHealth,
  TaskCategory,
} from './types/index.js';

export const App: React.FC = () => {
  // App branding (configurable in UI)
  const [appName, setAppName] = useState(() => {
    const saved = localStorage.getItem('promptwise_app_name') || localStorage.getItem('optiprompt_app_name');
    if (!saved || saved === 'OptiPrompt') return 'PromptWise';
    return saved;
  });

  const handleUpdateAppName = (name: string) => {
    setAppName(name);
    localStorage.setItem('promptwise_app_name', name);
  };

  // Service Health
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Selected Model State
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('optiprompt_selected_model') || 'nvidia/nemotron-3.5-bolt-e4b';
  });

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('optiprompt_selected_model', modelId);
  };

  // Prompt input state
  const [rawPrompt, setRawPrompt] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Auto');

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable text state for the 3 variants
  const [originalText, setOriginalText] = useState('');
  const [highContextText, setHighContextText] = useState('');
  const [lowTokenText, setLowTokenText] = useState('');

  // Stale request tracking (FR-6 / UX)
  const latestRequestIdRef = useRef<number>(0);

  // Execution state (Phase 2)
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedVariant, setExecutedVariant] = useState<
    'original' | 'highContext' | 'lowToken' | 'custom'
  >('lowToken');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const executionRef = useRef<HTMLDivElement>(null);
  const executionAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch health status on mount
  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((data) => {
        if (active) {
          setHealth(data);
          // If user had legacy gemini-3.8-flash stored in localStorage, switch to active Nemotron model
          const savedModel = localStorage.getItem('optiprompt_selected_model');
          if (data.model && (!savedModel || savedModel === 'gemini-3.8-flash')) {
            setSelectedModel(data.model);
            localStorage.setItem('optiprompt_selected_model', data.model);
          }
        }
      })
      .catch(() => {
        if (active) setHealth(null);
      })
      .finally(() => {
        if (active) setHealthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Phase 1: Optimize Prompt with Real SSE Streaming
  const handleOptimize = async () => {
    if (!rawPrompt.trim() || isOptimizing) return;

    setErrorMessage(null);
    setIsOptimizing(true);
    const reqTimestamp = Date.now();
    latestRequestIdRef.current = reqTimestamp;

    // Real SSE streaming progress stages
    setProgressStep('Connecting to Optimization Pipeline...');

    try {
      let result: OptimizationResult;
      if (typeof optimizePromptStream === 'function') {
        result = await optimizePromptStream(
          {
            rawPrompt,
            taskCategory: category,
            model: selectedModel,
          },
          (stage) => {
            if (latestRequestIdRef.current === reqTimestamp) {
              setProgressStep(stage.label);
            }
          }
        );
      } else {
        result = await optimizePrompt({
          rawPrompt,
          taskCategory: category,
          model: selectedModel,
        });
      }

      // Avoid stale response overwriting
      if (latestRequestIdRef.current !== reqTimestamp) return;

      setOptimizationResult(result);
      setOriginalText(result.rawPrompt);
      setHighContextText(result.highContext);
      setLowTokenText(result.lowToken);
    } catch (err: any) {
      if (latestRequestIdRef.current === reqTimestamp) {
        setErrorMessage(err.message || 'Failed to optimize prompt. Please check your connection.');
      }
    } finally {
      if (latestRequestIdRef.current === reqTimestamp) {
        setIsOptimizing(false);
        setProgressStep(null);
      }
    }
  };

  // Phase 2: Execute Selected Variant
  const handleExecute = async (
    textToExecute: string,
    variantType: 'original' | 'highContext' | 'lowToken'
  ) => {
    if (!textToExecute.trim() || isExecuting) return;

    if (executionAbortControllerRef.current) {
      executionAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    executionAbortControllerRef.current = controller;

    setErrorMessage(null);
    setIsExecuting(true);
    setExecutedVariant(variantType);

    try {
      const result = await executePrompt(
        {
          prompt: textToExecute,
          variantType,
          model: selectedModel,
        },
        controller.signal
      );

      setExecutionResult(result);

      // Smooth scroll to execution results
      setTimeout(() => {
        executionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setErrorMessage('Prompt execution was stopped.');
      } else {
        setErrorMessage(
          `Execution failed: ${err.message || 'The model encountered an error executing your prompt.'}`
        );
      }
    } finally {
      if (executionAbortControllerRef.current === controller) {
        setIsExecuting(false);
        executionAbortControllerRef.current = null;
      }
    }
  };

  const handleStopExecution = () => {
    if (executionAbortControllerRef.current) {
      executionAbortControllerRef.current.abort();
      executionAbortControllerRef.current = null;
    }
    setIsExecuting(false);
    setErrorMessage('Prompt execution was stopped.');
  };

  // Sidebar collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F0F4F9] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans overflow-hidden">
      {/* Left Sidebar (Collapsible Gemini navigation drawer) */}
      <aside
        className={`transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? 'w-64' : 'w-16'
        } hidden md:flex flex-col h-full bg-[#E9EEF6] dark:bg-[#1E1F20] border-r border-[#E0E2E0] dark:border-[#282A2C] py-4 px-3 justify-between z-30`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-full hover:bg-[#D3E3FD]/50 dark:hover:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] transition-colors"
              title={isSidebarOpen ? 'Collapse menu' : 'Expand menu'}
              aria-label={isSidebarOpen ? 'Collapse menu' : 'Expand menu'}
            >
              <Zap className="w-5 h-5 text-[#1A73E8] dark:text-[#8AB4F8]" />
            </button>
            {isSidebarOpen && (
              <span className="text-xs font-semibold uppercase tracking-wider text-[#444746] dark:text-[#9AA0A6]">
                {appName}
              </span>
            )}
          </div>

          {isSidebarOpen && (
            <div className="space-y-3 pt-2 text-xs text-[#444746] dark:text-[#C4C7C5] animate-fadeIn">
              <div className="p-3 bg-white dark:bg-[#131314] rounded-2xl border border-[#E0E2E0] dark:border-[#282A2C] shadow-sm space-y-1">
                <span className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] block">Engine Mode</span>
                <p className="text-[11px] leading-relaxed text-[#444746] dark:text-[#9AA0A6]">
                  Phase 1 optimizes & benchmarks token count. Phase 2 executes the approved prompt.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#131314] rounded-2xl border border-[#E0E2E0] dark:border-[#282A2C] shadow-sm space-y-1">
                <span className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] block">Active Model</span>
                <p className="font-mono text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] truncate">
                  {selectedModel}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar bottom telemetry info */}
        <div className="px-1 text-[11px] text-[#444746] dark:text-[#5F6368] overflow-hidden whitespace-nowrap">
          {isSidebarOpen ? 'Gemini Native Tokenizer API' : '⚡'}
        </div>
      </aside>

      {/* Main Column: Header + Scrollable Canvas + Floating Bottom Input */}
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        {/* Header */}
        <Header
          appName={appName}
          onUpdateAppName={handleUpdateAppName}
          health={health}
          healthLoading={healthLoading}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
        />

        {/* Main Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto w-full relative z-10 px-4 md:px-10 flex justify-center">
          <div className="w-full max-w-[1200px] flex flex-col gap-6 pt-6">
            {/* Value Proposition Hero / Greeting */}
            <div className="text-left space-y-2 max-w-3xl pt-2">
              <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1F1F1F] dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-[#1A73E8] via-[#8AB4F8] to-[#C58AF9] bg-clip-text text-transparent font-medium">
                  Hello, Developer
                </span>
              </h2>
              <p className="text-sm text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                Transform raw prompts into high-context structures and token-efficient variants with native Gemini token measurement.
              </p>
            </div>

            {/* Global Error Banner */}
            {errorMessage && (
              <div
                id="error-banner"
                className="flex items-start space-x-3 p-4 rounded-2xl bg-red-50 dark:bg-[#3B181A]/40 border border-red-200 dark:border-[#6B2529] text-red-700 dark:text-[#F28B82] text-xs animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-[#F28B82] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Error</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Optimization Results Section */}
            {optimizationResult && (
              <section
                id="optimization-results-section"
                className="space-y-6 animate-fadeIn"
                aria-label="Comparison and Analytics"
              >
                {/* Already Optimized Notification Banner */}
                {(optimizationResult.isAlreadyOptimized || optimizationResult.optimizationStatus === 'ALREADY_OPTIMIZED') && (
                  <div
                    id="already-optimized-banner"
                    className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-[#1E2E25] border border-emerald-200 dark:border-[#2E573D] shadow-sm flex items-start space-x-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-[#81C995] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-[#1F1F1F] dark:text-white tracking-wide">
                          Prompt is Already Optimized
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-[#81C995] text-[10px] font-bold uppercase tracking-wider">
                          Optimal Density & Structure
                        </span>
                      </div>
                      <p className="text-xs text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                        The submitted prompt is already concise, well-structured, and token-efficient. No unnecessary compression was required.
                      </p>
                    </div>
                  </div>
                )}

                {/* Zero-Shot Security Shield Banner */}
                {optimizationResult.securityWarnings && optimizationResult.securityWarnings.length > 0 && (
                  <WarningBanner securityWarnings={optimizationResult.securityWarnings} />
                )}

                {/* Warnings (if any) */}
                <WarningsBanner warnings={optimizationResult.warnings} />

                {/* Recommendation Card */}
                {optimizationResult.recommendation && (
                  <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E2E0] dark:border-[#282A2C] shadow-sm flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-[#1A73E8] dark:text-[#8AB4F8] flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#1F1F1F] dark:text-white uppercase tracking-wider text-[11px]">
                          Engine Recommendation:
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#1A73E8]/20 text-[#1A73E8] dark:text-[#8AB4F8] font-semibold text-[11px]">
                          {optimizationResult.recommendation.variant === 'highContext'
                            ? 'High-Context Variant'
                            : optimizationResult.recommendation.variant === 'lowToken'
                            ? 'Low-Token Variant'
                            : 'Original Prompt'}
                        </span>
                      </div>
                      <p className="text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                        {optimizationResult.recommendation.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Token Analytics Bar */}
                <TokenComparisonBar metrics={optimizationResult.metrics} />

                {/* Detected Invariants and Constraints */}
                <ConstraintBadges
                  constraints={optimizationResult.detectedConstraints}
                  intentSummary={optimizationResult.intentSummary}
                />

                {/* 3-Column Side-by-Side Comparison */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[#444746] dark:text-[#9AA0A6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#1A73E8] dark:text-[#8AB4F8]" />
                      <span>Side-by-Side Prompt Comparison</span>
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#1E1F20] border border-[#E0E2E0] dark:border-[#282A2C] text-xs shadow-sm">
                      <span className="text-[#444746] dark:text-[#9AA0A6]">Model:</span>
                      <span className="font-semibold text-[#1A73E8] dark:text-[#8AB4F8] font-mono text-[11px]">
                        {optimizationResult.model}
                      </span>
                    </div>
                  </div>

                  {isExecuting && (
                    <div className="mb-4 flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 shadow-sm">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-xs font-medium">
                          Executing <strong>{executedVariant === 'original' ? 'Original Prompt' : executedVariant === 'highContext' ? 'High-Context Variant' : 'Low-Token Variant'}</strong> with <strong>{getModelDisplayName(selectedModel).name}</strong>...
                        </span>
                      </div>
                      <button
                        onClick={handleStopExecution}
                        id="global-stop-execution-btn"
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm active:scale-[0.98]"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop Execution</span>
                      </button>
                    </div>
                  )}

                  {/* Stage Timings Telemetry */}
                  {optimizationResult.timings && (
                    <div className="flex flex-wrap items-center justify-between px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E0E2E0] dark:border-[#282A2C] text-[11px] text-[#444746] dark:text-[#9AA0A6] mb-3">
                      <span className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Latency: <span className="font-mono text-emerald-600 dark:text-[#81C995] font-bold">{optimizationResult.timings.totalMs} ms</span>
                      </span>
                      <div className="flex items-center space-x-3 text-[#444746] dark:text-[#9AA0A6] font-mono text-[10px]">
                        <span>Gen: <strong className="text-[#1F1F1F] dark:text-[#E3E3E3]">{optimizationResult.timings.analysisAndGenerationMs}ms</strong></span>
                        <span>•</span>
                        <span>Tokens: <strong className="text-[#1F1F1F] dark:text-[#E3E3E3]">{optimizationResult.timings.tokenCountingMs}ms</strong></span>
                        <span>•</span>
                        <span>Verify: <strong className="text-[#1F1F1F] dark:text-[#E3E3E3]">{optimizationResult.timings.verificationMs}ms</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* 1. Original Prompt Column */}
                    <VariantColumn
                      id="original"
                      title="Original Prompt"
                      subtitle={
                        optimizationResult.isAlreadyOptimized
                          ? '✨ Optimal in structure & token density'
                          : 'Raw prompt submitted by user'
                      }
                      variantType="original"
                      initialText={optimizationResult.rawPrompt}
                      currentText={originalText}
                      onTextChange={setOriginalText}
                      tokenCount={optimizationResult.metrics.rawTokens}
                      deltaPercent={null}
                      isRecommended={
                        optimizationResult.recommendation.variant === 'original' ||
                        Boolean(optimizationResult.isAlreadyOptimized)
                      }
                      onExecute={() => handleExecute(originalText, 'original')}
                      onStop={handleStopExecution}
                      isExecuting={isExecuting}
                      isCurrentExecuting={isExecuting && executedVariant === 'original'}
                      generatingModel={optimizationResult.model}
                      targetProvider={optimizationResult.targetProvider}
                      accentColor="slate"
                    />

                    {/* 2. High-Context Variant Column */}
                    <VariantColumn
                      id="high-context"
                      title="High-Context Variant"
                      subtitle="Added structure, role, constraints & output criteria"
                      variantType="highContext"
                      initialText={optimizationResult.highContext}
                      currentText={highContextText}
                      onTextChange={setHighContextText}
                      tokenCount={optimizationResult.metrics.highContextTokens}
                      deltaPercent={optimizationResult.metrics.highContextChangePercent}
                      isRecommended={optimizationResult.recommendation.variant === 'highContext'}
                      onExecute={() => handleExecute(highContextText, 'highContext')}
                      onStop={handleStopExecution}
                      isExecuting={isExecuting}
                      isCurrentExecuting={isExecuting && executedVariant === 'highContext'}
                      verificationDetails={optimizationResult.verificationStatus?.highContext}
                      generatingModel={optimizationResult.model}
                      targetProvider={optimizationResult.targetProvider}
                      accentColor="sky"
                    />

                    {/* 3. Low-Token Variant Column */}
                    <VariantColumn
                      id="low-token"
                      title="Low-Token Variant"
                      subtitle="Lean imperative phrasing, 100% constraint preservation"
                      variantType="lowToken"
                      initialText={optimizationResult.lowToken}
                      currentText={lowTokenText}
                      onTextChange={setLowTokenText}
                      tokenCount={optimizationResult.metrics.lowTokenTokens}
                      deltaPercent={optimizationResult.metrics.lowTokenReductionPercent}
                      isRecommended={optimizationResult.recommendation.variant === 'lowToken'}
                      onExecute={() => handleExecute(lowTokenText, 'lowToken')}
                      onStop={handleStopExecution}
                      isExecuting={isExecuting}
                      isCurrentExecuting={isExecuting && executedVariant === 'lowToken'}
                      verificationDetails={optimizationResult.verificationStatus?.lowToken}
                      generatingModel={optimizationResult.model}
                      targetProvider={optimizationResult.targetProvider}
                      accentColor="emerald"
                    />
                  </div>
                </div>

                {/* Multi-Model Cost Arbitrage Router */}
                {optimizationResult.arbitrageMetrics && optimizationResult.arbitrageMetrics.length > 0 && (
                  <CostArbitrageTable arbitrageMetrics={optimizationResult.arbitrageMetrics} />
                )}
              </section>
            )}

            {/* Phase 2: Execution Result Panel */}
            {executionResult && (
              <div ref={executionRef} className="pt-2 animate-slideUp">
                <ExecutionOutputPanel
                  result={executionResult}
                  variantType={executedVariant}
                />
              </div>
            )}

            {/* Scroll Spacer to clear the sticky footer */}
            <div className="h-[450px] w-full flex-shrink-0" aria-hidden="true" />
          </div>
        </main>

        {/* Locked Footer to Viewport */}
        <div className="fixed bottom-0 left-0 right-0 w-full z-30 bg-gradient-to-t from-[#F0F4F9] via-[#F0F4F9] to-transparent dark:from-[#131314] dark:via-[#131314] pt-20 pb-6 px-4 flex justify-center pointer-events-none">
          <div className="w-full max-w-[850px] pointer-events-auto">
            <section aria-label="Prompt Input">
              <PromptInputPanel
                rawPrompt={rawPrompt}
                onPromptChange={setRawPrompt}
                category={category}
                onCategoryChange={setCategory}
                selectedModel={selectedModel}
                onModelChange={handleSelectModel}
                onOptimize={handleOptimize}
                isOptimizing={isOptimizing}
                progressStep={progressStep}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
