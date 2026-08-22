/**
 * NYASA Media Analysis Component
 * Shows media authenticity and context consistency as SEPARATE first-class outputs.
 * This is NYASA's most important differentiator.
 */

import type { MediaAnalysisResult } from '../types/verification';

interface MediaAnalysisProps {
  analysis: MediaAnalysisResult;
}

const AUTH_STYLES: Record<string, { color: string; icon: string; label: string }> = {
  likely_authentic: { color: '#10b981', icon: '✓', label: 'Likely Authentic' },
  possible_manipulation: { color: '#f59e0b', icon: '⚠', label: 'Possible Manipulation' },
  likely_synthetic: { color: '#ef4444', icon: '⚠', label: 'Likely Synthetic' },
  unable_to_determine: { color: '#6b7280', icon: '?', label: 'Unable to Determine' },
};

const CTX_STYLES: Record<string, { color: string; icon: string; label: string }> = {
  consistent: { color: '#10b981', icon: '✓', label: 'Consistent' },
  partially_consistent: { color: '#f59e0b', icon: '~', label: 'Partially Consistent' },
  inconsistent: { color: '#ef4444', icon: '✗', label: 'Inconsistent' },
  unverifiable: { color: '#6b7280', icon: '?', label: 'Unverifiable' },
};

export default function MediaAnalysis({ analysis }: MediaAnalysisProps) {
  const authStyle = AUTH_STYLES[analysis.media_authenticity.assessment] || AUTH_STYLES.unable_to_determine;
  const ctxStyle = CTX_STYLES[analysis.context_consistency.assessment] || CTX_STYLES.unverifiable;

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold text-nyasa-text mb-1">Media Analysis</h3>
      <p className="text-xs text-nyasa-text-dim mb-5">
        Media authenticity and context consistency are evaluated independently
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Media Authenticity */}
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: `${authStyle.color}08`,
            borderColor: `${authStyle.color}25`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: `${authStyle.color}15`, color: authStyle.color }}
            >
              {authStyle.icon}
            </span>
            <div>
              <p className="text-xs text-nyasa-text-dim uppercase tracking-wider">Media Authenticity</p>
              <p className="font-semibold text-sm" style={{ color: authStyle.color }}>
                {authStyle.label}
              </p>
            </div>
          </div>
          <p className="text-xs text-nyasa-text-muted">
            {analysis.media_authenticity.description}
          </p>
          {analysis.media_authenticity.signals.length > 0 && (
            <div className="mt-3 space-y-1">
              {analysis.media_authenticity.signals.map((s, i) => (
                <p key={i} className="text-[11px] text-nyasa-text-dim flex items-start gap-1.5">
                  <span className="mt-0.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: authStyle.color }} />
                  {s.description}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Context Consistency */}
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: `${ctxStyle.color}08`,
            borderColor: `${ctxStyle.color}25`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: `${ctxStyle.color}15`, color: ctxStyle.color }}
            >
              {ctxStyle.icon}
            </span>
            <div>
              <p className="text-xs text-nyasa-text-dim uppercase tracking-wider">Context Consistency</p>
              <p className="font-semibold text-sm" style={{ color: ctxStyle.color }}>
                {ctxStyle.label}
              </p>
            </div>
          </div>
          <p className="text-xs text-nyasa-text-muted">
            {analysis.context_consistency.description}
          </p>
          {analysis.context_consistency.signals.length > 0 && (
            <div className="mt-3 space-y-1">
              {analysis.context_consistency.signals.map((s, i) => (
                <p key={i} className="text-[11px] text-nyasa-text-dim flex items-start gap-1.5">
                  <span className="mt-0.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: ctxStyle.color }} />
                  {s.description}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Description */}
      {analysis.visual_description && (
        <div className="p-3 rounded-lg bg-nyasa-surface/50 border border-nyasa-border">
          <p className="text-xs text-nyasa-text-dim mb-1 uppercase tracking-wider">What the image shows</p>
          <p className="text-sm text-nyasa-text-muted">{analysis.visual_description}</p>
        </div>
      )}

      {/* OCR Text */}
      {analysis.ocr_text && (
        <div className="mt-3 p-3 rounded-lg bg-nyasa-surface/50 border border-nyasa-border">
          <p className="text-xs text-nyasa-text-dim mb-1 uppercase tracking-wider">Detected text in media</p>
          <p className="text-sm text-nyasa-text-muted font-mono">{analysis.ocr_text}</p>
        </div>
      )}
    </div>
  );
}
