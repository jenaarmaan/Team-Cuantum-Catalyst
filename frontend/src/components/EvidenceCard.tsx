/**
 * NYASA Evidence Card
 * Displays a single piece of evidence with stance badge, source info, and link.
 * Every evidence item is traceable to its source.
 */

import type { EvidenceItem } from '../types/verification';
import { STANCE_CONFIGS } from '../types/verification';

interface EvidenceCardProps {
  item: EvidenceItem;
  index: number;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  government: '🏛️ Government',
  news_major: '📰 Major News',
  news_local: '📰 Local News',
  fact_checker: '✅ Fact Checker',
  academic: '🎓 Academic',
  official_org: '🏢 Official Org',
  blog: '✍️ Blog',
  social_media: '📱 Social Media',
  forum: '💬 Forum',
  unknown: '🔗 Web Source',
};

export default function EvidenceCard({ item, index }: EvidenceCardProps) {
  const stanceConfig = STANCE_CONFIGS[item.stance];

  return (
    <div
      className="glass-card p-5 animate-fade-in-up"
      style={{
        animationDelay: `${index * 100}ms`,
        borderLeft: `3px solid ${stanceConfig.color}`,
      }}
    >
      {/* Header: Stance + Source Type */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Stance Badge */}
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${stanceConfig.color}15`,
              color: stanceConfig.color,
              border: `1px solid ${stanceConfig.color}30`,
            }}
          >
            <span>{stanceConfig.icon}</span>
            {stanceConfig.label}
          </span>

          {/* Source Type */}
          <span className="text-xs text-nyasa-text-dim">
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </span>
        </div>

        {/* Authority Score */}
        <span className="text-xs px-2 py-1 rounded-md bg-nyasa-surface text-nyasa-text-dim">
          Authority: {Math.round(item.authority_score * 100)}%
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-nyasa-text mb-2 leading-snug">
        {item.title}
      </h4>

      {/* Snippet */}
      <p className="text-sm text-nyasa-text-muted mb-3 line-clamp-3">
        {item.snippet}
      </p>

      {/* Stance Reasoning */}
      {item.stance_reasoning && (
        <p className="text-xs text-nyasa-text-dim mb-3 italic border-l-2 border-nyasa-border pl-3">
          {item.stance_reasoning}
        </p>
      )}

      {/* Footer: Source + Date + Link */}
      <div className="flex items-center justify-between text-xs text-nyasa-text-dim">
        <div className="flex items-center gap-3">
          <span>{item.source_name}</span>
          {item.published_date && (
            <>
              <span>·</span>
              <span>{item.published_date}</span>
            </>
          )}
        </div>
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nyasa-primary hover:text-nyasa-primary-glow transition-colors flex items-center gap-1"
        >
          View source
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Retrieval timestamp */}
      <p className="text-[10px] text-nyasa-text-dim/50 mt-2">
        Retrieved: {new Date(item.retrieved_at).toLocaleString()}
      </p>
    </div>
  );
}
