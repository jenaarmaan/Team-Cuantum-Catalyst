/**
 * NYASA Assessment Card
 * The primary visual output — shows the non-binary assessment label,
 * confidence ring, and uncertainty badge.
 */

import type { AssessmentResult, UncertaintyResult } from '../types/verification';
import { ASSESSMENT_CONFIGS } from '../types/verification';
import ConfidenceMeter from './ConfidenceMeter';

interface AssessmentCardProps {
  assessment: AssessmentResult;
  uncertainty: UncertaintyResult;
}

const UNCERTAINTY_STYLES = {
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
  moderate: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
};

export default function AssessmentCard({ assessment, uncertainty }: AssessmentCardProps) {
  const config = ASSESSMENT_CONFIGS[assessment.label];
  const uncStyle = UNCERTAINTY_STYLES[uncertainty.level];

  return (
    <div
      className="glass-card p-8 animate-fade-in-up"
      style={{ borderColor: `${config.color}30` }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Confidence Ring */}
        <div className="shrink-0">
          <ConfidenceMeter percent={assessment.confidence_percent} color={config.color} size={140} />
        </div>

        {/* Assessment Info */}
        <div className="flex-1 text-center md:text-left">
          {/* Label */}
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
            <span className="text-2xl">{config.icon}</span>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: config.color }}>
              {assessment.display_label}
            </h2>
          </div>

          {/* NYASA Confidence Score & ECS note */}
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start mb-5">
            <p className="text-sm text-nyasa-text-dim">
              NYASA Confidence Score: <span className="font-semibold text-nyasa-text">{assessment.confidence_percent}%</span>
            </p>
            <span className="hidden md:inline text-nyasa-text-dim">|</span>
            <p className="text-sm text-nyasa-text-dim">
              Evidence Credibility (ECS): <span className="font-semibold text-nyasa-primary-glow bg-nyasa-primary/10 px-2 py-0.5 rounded text-nyasa-text">{assessment.ecs} / 100</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            {/* Uncertainty Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: uncStyle.bg,
                border: `1px solid ${uncStyle.border}`,
                color: uncStyle.color,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: uncStyle.color }} />
              Uncertainty: {uncertainty.level.charAt(0).toUpperCase() + uncertainty.level.slice(1)}
            </div>

            {/* ECS Badge Info Link/Label */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-nyasa-surface border border-nyasa-border text-nyasa-text-muted">
              🛡️ ECS verifies evidence quality & independence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
