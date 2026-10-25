import React from 'react';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

interface WarningBannerProps {
  securityWarnings?: string[];
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  securityWarnings,
  className = '',
}) => {
  if (!securityWarnings || securityWarnings.length === 0) return null;

  return (
    <div
      id="security-warning-banner"
      className={`p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-700/50 shadow-sm flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 animate-fadeIn ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
        <ShieldAlert className="w-5 h-5" />
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 tracking-wide flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Zero-Shot Prompt Security Shield
          </h4>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
            Adversarial Vector Detected
          </span>
        </div>

        <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
          The input prompt contains patterns that attempt to override system instructions, extract protected credentials, or alter persona guardrails. The pipeline intercepted these vectors and sanitized execution.
        </p>

        <div className="space-y-1.5 pt-1">
          {securityWarnings.map((warning, idx) => {
            const colonIndex = warning.indexOf(':');
            const code = colonIndex !== -1 ? warning.slice(0, colonIndex).trim() : 'SECURITY_ALERT';
            const message = colonIndex !== -1 ? warning.slice(colonIndex + 1).trim() : warning;

            return (
              <div
                key={idx}
                className="flex items-start space-x-2 text-xs p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/50 border border-amber-500/20 text-amber-900 dark:text-amber-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-[10px] text-amber-700 dark:text-amber-400 block uppercase">
                    {code}
                  </span>
                  <span className="leading-snug">{message}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
