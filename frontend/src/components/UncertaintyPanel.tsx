/**
 * NYASA Uncertainty Panel
 * Displays what NYASA couldn't determine — structured uncertainty, not a generic disclaimer.
 */

import type { UncertaintyResult } from '../types/verification';

interface UncertaintyPanelProps {
  uncertainty: UncertaintyResult;
}

const IMPACT_STYLES: Record<string, string> = {
  high: 'text-nyasa-contradicted bg-nyasa-contradicted/10 border-nyasa-contradicted/20',
  moderate: 'text-nyasa-misleading bg-nyasa-misleading/10 border-nyasa-misleading/20',
  low: 'text-nyasa-text-muted bg-nyasa-surface border-nyasa-border',
};

export default function UncertaintyPanel({ uncertainty }: UncertaintyPanelProps) {
  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-nyasa-misleading/10 flex items-center justify-center">
          <span className="text-lg">❓</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-nyasa-text">What NYASA Doesn't Know</h3>
          <p className="text-xs text-nyasa-text-dim">
            Uncertainty factors that may affect this assessment
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-nyasa-text-muted mb-5 p-3 rounded-lg bg-nyasa-surface/50 border border-nyasa-border">
        {uncertainty.summary}
      </p>

      {/* Factors */}
      {uncertainty.factors.length > 0 && (
        <div className="space-y-3 mb-5">
          {uncertainty.factors.map((factor, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${IMPACT_STYLES[factor.impact] || IMPACT_STYLES.moderate}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5 px-2 py-0.5 rounded">
                {factor.impact}
              </span>
              <p className="text-sm">{factor.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* What Would Help */}
      {uncertainty.what_would_help.length > 0 && (
        <div>
          <p className="text-xs text-nyasa-text-dim uppercase tracking-wider mb-2">
            What would reduce uncertainty
          </p>
          <div className="space-y-2">
            {uncertainty.what_would_help.map((help, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-nyasa-text-muted">
                <span className="text-nyasa-primary mt-0.5">→</span>
                <span>{help}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
