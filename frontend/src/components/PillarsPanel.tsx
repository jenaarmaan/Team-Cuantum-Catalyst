/**
 * NYASA Pillars Panel
 * Displays the 6 pillars of NYASA verification:
 * 1. Provenance & Metadata
 * 2. C2PA / Cryptographic Provenance
 * 3. Media Forensics
 * 4. Temporal & Structural Consistency
 * 5. Cross-Modal Consistency
 * 6. External Source & Context Verification
 */

import { useState } from 'react';
import type { PillarResult } from '../types/verification';

interface PillarsPanelProps {
  pillars: PillarResult[];
}

const STATUS_CONFIGS: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
  // Provenance & Metadata
  available: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Available', icon: '✓' },
  unavailable: { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)', label: 'Unavailable', icon: '⚬' },
  
  // C2PA
  valid: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Valid signature', icon: '🔐' },
  invalid: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Invalid signature', icon: '🔓' },
  
  // Forensics
  likely_authentic: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Likely Authentic', icon: '🛡️' },
  suspicious: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Suspicious anomalies', icon: '⚠' },
  unverifiable: { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)', label: 'Unverifiable', icon: '⚬' },

  // Temporal / Cross-Modal
  consistent: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Consistent', icon: '✓' },
  inconsistent: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Inconsistent', icon: '✗' },
  not_applicable: { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.05)', label: 'Not Applicable', icon: '—' },

  // Context
  supported: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Supported', icon: '✓' },
  contradicted: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Contradicted', icon: '✗' },
  inconsistent_context: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Context mismatch', icon: '⚠' },
};

export default function PillarsPanel({ pillars }: PillarsPanelProps) {
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);

  if (!pillars || pillars.length === 0) return null;

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-nyasa-primary/10 flex items-center justify-center">
          <span className="text-lg">🏛️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-nyasa-text">The 6 Pillars of NYASA</h3>
          <p className="text-xs text-nyasa-text-dim">
            Evidence convergence across independent verification signals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pillars.map((pillar, index) => {
          const config = STATUS_CONFIGS[pillar.status] || {
            color: '#94a3b8',
            bgColor: 'rgba(148, 163, 184, 0.1)',
            label: pillar.status.replace('_', ' '),
            icon: '⚬'
          };
          const isExpanded = expandedPillar === index;

          return (
            <div
              key={pillar.name}
              onClick={() => setExpandedPillar(isExpanded ? null : index)}
              className={`
                p-4 rounded-xl border transition-all duration-200 cursor-pointer
                ${isExpanded 
                  ? 'bg-nyasa-card border-nyasa-border-light shadow-md' 
                  : 'bg-nyasa-surface/30 border-nyasa-border hover:bg-nyasa-surface/65'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-nyasa-text mb-1">
                    {pillar.name}
                  </h4>
                  <p className="text-xs text-nyasa-text-muted mb-2">
                    {pillar.summary}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                    border: `1px solid ${config.color}25`
                  }}
                >
                  {config.icon} {config.label}
                </span>
              </div>

              {/* Expandable details */}
              {isExpanded && pillar.details.length > 0 && (
                <div className="mt-3 pt-3 border-t border-nyasa-border-light animate-fade-in-up space-y-1.5">
                  {pillar.details.map((detail, dIdx) => (
                    <p key={dIdx} className="text-xs text-nyasa-text-dim flex items-start gap-2">
                      <span className="text-nyasa-primary mt-0.5">•</span>
                      <span>{detail}</span>
                    </p>
                  ))}
                  {pillar.score !== null && (
                    <p className="text-[10px] text-nyasa-text-dim/80 font-mono mt-2">
                      Pillar signal strength: {Math.round(pillar.score * 100)}%
                    </p>
                  )}
                </div>
              )}

              {/* Show toggle text */}
              <div className="mt-2 text-right">
                <span className="text-[10px] text-nyasa-primary hover:underline">
                  {isExpanded ? 'Collapse' : 'Show details'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
