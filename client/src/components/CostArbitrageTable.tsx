import React, { useState } from 'react';
import { Coins, TrendingDown, Layers, Calculator, CheckCircle2 } from 'lucide-react';
import { CostArbitrageItem } from '../types/index.js';

interface CostArbitrageTableProps {
  arbitrageMetrics?: CostArbitrageItem[];
  className?: string;
}

export const CostArbitrageTable: React.FC<CostArbitrageTableProps> = ({
  arbitrageMetrics,
  className = '',
}) => {
  const [scale, setScale] = useState<'single' | '1k' | '1m'>('1k');
  const [showFormula, setShowFormula] = useState(false);

  if (!arbitrageMetrics || arbitrageMetrics.length === 0) return null;

  // Find model with highest savings percent
  const bestModel = arbitrageMetrics.reduce((prev, current) =>
    current.savingsPercentVsBaseline > prev.savingsPercentVsBaseline ? current : prev
  );

  return (
    <div
      id="cost-arbitrage-table-card"
      className={`bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2E0] dark:border-[#282A2C] p-5 shadow-sm animate-fadeIn ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[#E0E2E0] dark:border-[#282A2C]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#81C995] flex items-center justify-center flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-white tracking-tight">
                Multi-Model Cost Arbitrage Router
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#81C995] text-[10px] font-bold uppercase tracking-wider">
                Live Spend Comparison
              </span>
            </div>
            <p className="text-xs text-[#444746] dark:text-[#9AA0A6] mt-0.5">
              Calculates invocation spend (<span className="font-mono">T_in · P_in + T_out · P_out</span>) across leading cost-efficient models vs standard flagship baseline.
            </p>
          </div>
        </div>

        {/* Scale Toggle & Formula Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#E0E2E0] dark:border-[#3C4043] text-xs text-[#444746] dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Formula Breakdown"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formula</span>
          </button>

          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#131314] border border-[#E0E2E0] dark:border-[#282A2C] text-xs">
            <button
              type="button"
              onClick={() => setScale('single')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scale === 'single'
                  ? 'bg-white dark:bg-[#282A2C] text-[#1F1F1F] dark:text-white shadow-xs'
                  : 'text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white'
              }`}
            >
              1 Call
            </button>
            <button
              type="button"
              onClick={() => setScale('1k')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scale === '1k'
                  ? 'bg-white dark:bg-[#282A2C] text-[#1F1F1F] dark:text-white shadow-xs'
                  : 'text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white'
              }`}
            >
              1,000 Calls
            </button>
            <button
              type="button"
              onClick={() => setScale('1m')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scale === '1m'
                  ? 'bg-white dark:bg-[#282A2C] text-[#1F1F1F] dark:text-white shadow-xs'
                  : 'text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white'
              }`}
            >
              1M Calls
            </button>
          </div>
        </div>
      </div>

      {/* Formula Explanation Callout */}
      {showFormula && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-200 dark:border-[#282A2C] text-xs text-[#444746] dark:text-[#C4C7C5] animate-fadeIn">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-[#1F1F1F] dark:text-white flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
              Invocation Arbitrage Formula:
            </span>
            <span className="font-mono text-[10px] text-slate-500">Benchmark: GPT-4o Flagship ($2.50 in / $10.00 out per 1M)</span>
          </div>
          <p className="font-mono text-[11px] text-emerald-700 dark:text-[#81C995] bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
            Total Spend = (T_in · P_in) + (T_out · P_out)
          </p>
        </div>
      )}

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E0E2E0] dark:border-[#282A2C] text-[#444746] dark:text-[#9AA0A6] font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Target Model & Provider</th>
              <th className="py-2.5 px-3">Input Rate (/1M)</th>
              <th className="py-2.5 px-3">Output Rate (/1M)</th>
              <th className="py-2.5 px-3">
                {scale === 'single'
                  ? 'Spend / Single Call'
                  : scale === '1k'
                  ? 'Spend / 1k Calls'
                  : 'Spend / 1M Calls'}
              </th>
              <th className="py-2.5 px-3">Savings vs Baseline</th>
              <th className="py-2.5 px-3 text-right">Arbitrage Route</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E2E0]/60 dark:divide-[#282A2C]/60">
            {arbitrageMetrics.map((item) => {
              const isBest = item.model === bestModel.model;

              const displayCost =
                scale === 'single'
                  ? `$${item.totalCostPerCall.toFixed(6)}`
                  : scale === '1k'
                  ? `$${item.costPer1kCalls.toFixed(4)}`
                  : `$${(item.totalCostPerCall * 1_000_000).toFixed(2)}`;

              return (
                <tr
                  key={item.model}
                  className={`transition-colors ${
                    isBest
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/40 dark:hover:bg-emerald-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-[#282A2C]/30'
                  }`}
                >
                  {/* Model & Provider */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="font-mono font-bold text-[#1F1F1F] dark:text-white text-xs">
                        {item.model}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] text-[10px]">
                        {item.provider}
                      </span>
                    </div>
                  </td>

                  {/* Input Price */}
                  <td className="py-3 px-3 font-mono text-[#444746] dark:text-[#C4C7C5]">
                    ${item.inputPricePerM.toFixed(2)}
                  </td>

                  {/* Output Price */}
                  <td className="py-3 px-3 font-mono text-[#444746] dark:text-[#C4C7C5]">
                    ${item.outputPricePerM.toFixed(2)}
                  </td>

                  {/* Projected Spend */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-emerald-700 dark:text-[#81C995] text-xs">
                      {displayCost}
                    </span>
                  </td>

                  {/* Savings % */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-[#81C995]" />
                      <span className="font-bold text-emerald-700 dark:text-[#81C995] font-mono">
                        +{item.savingsPercentVsBaseline.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Badge / Route Recommendation */}
                  <td className="py-3 px-3 text-right">
                    {isBest ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-[#81C995] text-[10px] font-bold uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#81C995]" />
                        Optimal Arbitrage
                      </span>
                    ) : item.model.includes('haiku') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] text-[10px] font-medium">
                        <Layers className="w-3 h-3 text-amber-500" />
                        Balanced Router
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] text-[10px] font-medium">
                        <Coins className="w-3 h-3 text-blue-500" />
                        Cost-Effective
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
