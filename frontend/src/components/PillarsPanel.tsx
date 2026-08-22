import { useState } from 'react';
import type { PillarResult } from '../types/verification';
import SourceContextMap from './SourceContextMap';

interface PillarsPanelProps {
  pillars: PillarResult[];
  claimText: string;
}

const DIRECTION_STYLES: Record<string, { label: string; text: string; bg: string }> = {
  SUPPORTS_AUTHENTICITY: { label: 'Supports Authenticity', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/30' },
  SUPPORTS_CLAIM: { label: 'Supports Claim', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/30' },
  CONTRADICTS_AUTHENTICITY: { label: 'Contradicts Authenticity', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200/30' },
  CONTRADICTS_CLAIM: { label: 'Contradicts Claim', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200/30' },
  NEUTRAL: { label: 'Neutral', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/30 border border-slate-200/30' },
};

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  NOT_APPLICABLE: { label: 'N/A', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200/30', text: 'text-slate-400 dark:text-slate-500' },
  UNAVAILABLE: { label: 'UNAVAILABLE', bg: 'bg-slate-100 dark:bg-slate-850 border-slate-200/30', text: 'text-slate-500 dark:text-slate-400' },
  UNVERIFIABLE: { label: 'UNVERIFIABLE', bg: 'bg-slate-100 dark:bg-slate-850 border-slate-200/30', text: 'text-slate-500 dark:text-slate-400' },
  UNKNOWN: { label: 'UNKNOWN', bg: 'bg-slate-100 dark:bg-slate-850 border-slate-200/30', text: 'text-slate-500 dark:text-slate-400' },
  AUTHENTIC: { label: 'AUTHENTIC', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30', text: 'text-emerald-700 dark:text-emerald-400' },
  VERIFIED: { label: 'VERIFIED', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30', text: 'text-emerald-700 dark:text-emerald-400' },
  SUPPORTED: { label: 'SUPPORTED', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30', text: 'text-emerald-700 dark:text-emerald-400' },
  AVAILABLE: { label: 'AVAILABLE', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30', text: 'text-emerald-700 dark:text-emerald-400' },
  SUSPICIOUS: { label: 'SUSPICIOUS', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/30', text: 'text-rose-700 dark:text-rose-400' },
  CONTRADICTED: { label: 'CONTRADICTED', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/30', text: 'text-rose-700 dark:text-rose-400' },
  MISLEADING_CONTEXT: { label: 'MISLEADING CONTEXT', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/30', text: 'text-rose-700 dark:text-rose-400' },
};

export default function PillarsPanel({ pillars, claimText }: PillarsPanelProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  if (!pillars || pillars.length === 0) return null;

  // Detect and mock geographic evidence context dynamically for demonstration
  const claimLower = (claimText || '').toLowerCase();
  let claimedLocation = null;
  let evidenceLocations: any[] = [];

  if (claimLower.includes('mysuru') || claimLower.includes('modi') || claimLower.includes('flood')) {
    claimedLocation = {
      lat: 12.2958,
      lng: 76.6394,
      label: "Claimed: Mysuru, today"
    };
    evidenceLocations = [
      {
        lat: 31.5204,
        lng: 74.3587,
        label: "Lahore, Pakistan (2023)",
        source: "https://wikipedia.org/wiki/Lahore",
        date: "August 2023",
        relation: "contradicts"
      }
    ];
  }

  const handleToggle = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
      {/* Title Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-nyasa-primary/10 flex items-center justify-center">
          <span className="text-lg">🏛️</span>
        </div>
        <div>
          <h3 className="text-title-medium text-nyasa-text">Verification Pillars</h3>
          <p className="text-xs text-nyasa-text-dim">
            Six independent diagnostic dimensions of media and claim authenticity
          </p>
        </div>
      </div>

      {/* 6 Linear Expandable Rows */}
      <div className="divide-y divide-nyasa-border border border-nyasa-border rounded-2xl overflow-hidden bg-white dark:bg-nyasa-surface">
        {pillars.map((pillar) => {
          const isExpanded = expandedPillar === pillar.pillar_id;
          
          // Determine dynamic status styles
          const statusUpper = pillar.status.toUpperCase();
          const isNotApplicable = statusUpper === 'NOT_APPLICABLE';
          const isUnavailable = statusUpper === 'UNAVAILABLE' || statusUpper === 'UNKNOWN' || statusUpper === 'UNVERIFIABLE';
          
          const style = STATUS_STYLES[statusUpper] || {
            label: statusUpper.replace('_', ' '),
            bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200/30',
            text: 'text-slate-500 dark:text-slate-400'
          };

          // Stance Direction Style
          const directionStyle = DIRECTION_STYLES[pillar.direction] || DIRECTION_STYLES.NEUTRAL;

          return (
            <div 
              key={pillar.pillar_id}
              className={`transition-colors duration-150 ${isExpanded ? 'bg-slate-50/30' : ''}`}
            >
              {/* Row Header */}
              <div
                onClick={() => handleToggle(pillar.pillar_id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
              >
                {/* Left Side: Code, Name, Sub */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Status Indicator Circle */}
                  <span className={`
                    w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-mono-tech
                    ${isNotApplicable 
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' 
                      : isUnavailable 
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20'
                    }
                  `}>
                    {isNotApplicable ? '—' : isUnavailable ? '?' : '✓'}
                  </span>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech font-bold text-xs text-nyasa-text-dim shrink-0">
                        {pillar.pillar_id}
                      </span>
                      <h4 className="text-title-small text-nyasa-text truncate">
                        {pillar.name}
                      </h4>
                    </div>
                    {/* Concise subtext */}
                    <p className="text-xs text-nyasa-text-dim mt-0.5 max-w-xl truncate">
                      {pillar.summary || (isUnavailable ? 'No direct data triggers available for this dimension.' : '')}
                    </p>
                  </div>
                </div>

                {/* Right Side: Direction Badge, Toggle Button */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold uppercase tracking-wider border ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>

                  {/* Stance direction badge if available and applicable */}
                  {!isNotApplicable && !isUnavailable && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold uppercase tracking-wider ${directionStyle.bg} ${directionStyle.text}`}>
                      {directionStyle.label}
                    </span>
                  )}

                  {/* Toggle Arrow */}
                  <svg 
                    className={`w-4 h-4 text-nyasa-text-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Row Body (Expandable) */}
              {isExpanded && (
                <div className="px-11 pb-5 pt-1 border-t border-slate-100/50 space-y-4 animate-fade-in-up">
                  {/* Findings */}
                  {pillar.findings && pillar.findings.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-2 font-mono-tech">Key Findings</p>
                      <div className="space-y-1.5">
                        {pillar.findings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-nyasa-text-muted leading-relaxed">
                            <span className="text-nyasa-primary mt-0.5 shrink-0">▸</span>
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-nyasa-text-dim">No specific findings available for this pillar.</p>
                  )}

                  {/* Geolocation Map for P6 */}
                  {pillar.pillar_id === 'P6' && (
                    <div className="mt-4 pt-2">
                      <p className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-2 font-mono-tech">Geographic Evidence Map</p>
                      <SourceContextMap 
                        claimedLocation={claimedLocation} 
                        evidenceLocations={evidenceLocations} 
                      />
                    </div>
                  )}

                  {/* Limitations */}
                  {pillar.limitations && pillar.limitations.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-1.5 font-mono-tech">Pillar Limitations</p>
                      <div className="space-y-1">
                        {pillar.limitations.map((lim, idx) => (
                          <p key={idx} className="text-[11px] text-nyasa-text-dim flex items-start gap-1.5 leading-snug">
                            <span className="shrink-0">•</span>
                            <span>{lim}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {pillar.sources && pillar.sources.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-1.5 font-mono-tech">Evidence Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pillar.sources.map((src, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded bg-slate-50 border border-nyasa-border text-[9px] text-nyasa-text-muted truncate max-w-[200px]"
                            title={src}
                          >
                            {src.startsWith('http') ? src.split('/')[2] : src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pillar Signal Score */}
                  {pillar.applicable && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-nyasa-text-dim/80 font-mono-tech">
                      <span>Signal Confidence: {pillar.confidence}%</span>
                      <span>Signal Weight Score: {pillar.signal_score}/100</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
