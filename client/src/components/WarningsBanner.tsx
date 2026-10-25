import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { OptimizationWarning } from '../types/index.js';

interface WarningsBannerProps {
  warnings: OptimizationWarning[];
}

export const WarningsBanner: React.FC<WarningsBannerProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, idx) => {
        const isInjection = warning.code === 'PROMPT_INJECTION_DEFENSE_TRIGGERED';
        const isContradiction = warning.code === 'CONTRADICTORY_CONSTRAINTS';

        return (
          <div
            key={idx}
            className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs ${
              isInjection
                ? 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                : isContradiction
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
            }`}
          >
            {isInjection ? (
              <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            ) : isContradiction ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="space-y-0.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] block opacity-80">
                {warning.code}
              </span>
              <p className="leading-relaxed">{warning.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { WarningBanner } from './WarningBanner.js';
