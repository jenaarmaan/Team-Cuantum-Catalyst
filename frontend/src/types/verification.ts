/**
 * NYASA Verification Types
 * TypeScript interfaces matching the backend Pydantic schemas.
 */

// ── Enums ──

export type AssessmentLabel =
  | 'strongly_supported'
  | 'likely_supported'
  | 'inconclusive'
  | 'likely_misleading'
  | 'strongly_contradicted'
  | 'manipulation_signals_detected'
  | 'insufficient_evidence'
  | 'likely_authentic_and_supported'
  | 'likely_authentic_but_misleading_context'
  | 'likely_manipulated'
  | 'likely_synthetic'
  | 'claim_contradicted'
  | 'conflicting_evidence';

export type UncertaintyLevel = 'low' | 'moderate' | 'high';

export type EvidenceStance = 'supports' | 'contradicts' | 'context' | 'unresolved';

export type SourceType =
  | 'government'
  | 'news_major'
  | 'news_local'
  | 'fact_checker'
  | 'academic'
  | 'official_org'
  | 'blog'
  | 'social_media'
  | 'forum'
  | 'unknown';

export type MediaQuality = 'high' | 'moderate' | 'low' | 'very_low';

// ── Claim ──

export interface ExtractedClaim {
  original_text: string;
  normalized_claim: string;
  entities: string[];
  event_type: string | null;
  location: string | null;
  time_reference: string | null;
  key_assertion: string;
  atomic_claims: string[];
}

// ── Media Analysis ──

export interface MediaSignal {
  signal_type: string;
  description: string;
  confidence: number;
}

export interface MediaAuthenticity {
  assessment: string;
  signals: MediaSignal[];
  description: string;
}

export interface ContextConsistency {
  assessment: string;
  signals: MediaSignal[];
  description: string;
}

export interface MediaAnalysisResult {
  media_authenticity: MediaAuthenticity;
  context_consistency: ContextConsistency;
  visual_description: string;
  ocr_text: string | null;
  media_quality: MediaQuality;
}

// ── Provenance ──

export interface ProvenanceSignal {
  signal_type: string;
  description: string;
  source: string | null;
  date_found: string | null;
  confidence: number;
  url: string | null;
}

// ── Evidence ──

export interface EvidenceItem {
  evidence_id: string;
  title: string;
  snippet: string;
  source_name: string;
  source_type: SourceType;
  source_url: string;
  published_date: string | null;
  retrieved_at: string;
  stance: EvidenceStance;
  relevance_score: number;
  authority_score: number;
  stance_reasoning: string;
}

// ── Uncertainty ──

export interface UncertaintyFactor {
  factor: string;
  description: string;
  impact: string;
}

export interface UncertaintyResult {
  level: UncertaintyLevel;
  score: number;
  factors: UncertaintyFactor[];
  summary: string;
  what_would_help: string[];
}

// ─── 6 Pillars of NYASA ───

export interface PillarResult {
  pillar_id: string;
  name: string;
  status: string;
  applicable: boolean;
  signal_score: number;
  confidence: number;
  direction: string;
  evidence_strength: number;
  findings: string[];
  limitations: string[];
  sources: string[];
  
  // Legacy fields
  score: number | null;
  summary: string;
  details: string[];

  // Geographic evidence fields
  claimed_location?: { lat: number; lng: number; label: string } | null;
  evidence_locations?: Array<{ lat: number; lng: number; label: string; source: string; date: string | null; relation: 'matches' | 'contradicts' }> | [];
}

// ── Assessment ──

export interface AssessmentResult {
  label: AssessmentLabel;
  display_label: string;
  confidence: number;
  confidence_percent: number;
  ecs: number;
}

// ── Complete Response ──

export interface VerificationResponse {
  verification_id: string;
  status: string;
  timestamp: string;
  claim_text: string;
  has_media: boolean;
  extracted_claim: ExtractedClaim;
  media_analysis: MediaAnalysisResult | null;
  provenance_signals: ProvenanceSignal[];
  evidence: EvidenceItem[];
  pillars: PillarResult[];
  supporting_count: number;
  contradicting_count: number;
  context_count: number;
  unresolved_count: number;
  assessment: AssessmentResult;
  uncertainty: UncertaintyResult;
  explanation: string;
  key_findings: string[];
  recommended_action: string;
  limitations: string[];
  scoring_note: string;
  media_integrity?: { label: string; score: number; confidence: number } | null;
  context_integrity?: { label: string; score: number; confidence: number } | null;
  evidence_convergence?: { supporting_count: number; contradicting_count: number; contextual_count: number; unresolved_count: number } | null;
  uncertainty_reasons?: string[];
}

// ── UI Helpers ──

export interface AssessmentConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

export const ASSESSMENT_CONFIGS: Record<AssessmentLabel, AssessmentConfig> = {
  strongly_supported: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '🟢',
    label: 'Strongly Supported',
  },
  likely_supported: {
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.1)',
    icon: '🟢',
    label: 'Likely Supported',
  },
  inconclusive: {
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '🟣',
    label: 'Inconclusive',
  },
  likely_misleading: {
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '🟠',
    label: 'Likely Misleading',
  },
  strongly_contradicted: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '🔴',
    label: 'Strongly Contradicted',
  },
  manipulation_signals_detected: {
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    icon: '🔴',
    label: 'Manipulation Signals Detected',
  },
  insufficient_evidence: {
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: '⚪',
    label: 'Insufficient Evidence',
  },
  
  // New Taxonomy Outcome mappings
  likely_authentic_and_supported: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '🟢',
    label: 'Likely Authentic & Supported',
  },
  likely_authentic_but_misleading_context: {
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '🟠',
    label: 'Authentic Image, Misleading Context',
  },
  likely_manipulated: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '🔴',
    label: 'Likely Manipulated Image',
  },
  likely_synthetic: {
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    icon: '🤖',
    label: 'Likely Synthetic (AI-Generated)',
  },
  claim_contradicted: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '🔴',
    label: 'Claim Contradicted by Evidence',
  },
  conflicting_evidence: {
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '🟣',
    label: 'Conflicting Evidence',
  },
};

export const STANCE_CONFIGS: Record<EvidenceStance, { color: string; label: string; icon: string }> = {
  supports: { color: '#10b981', label: 'Supports', icon: '✓' },
  contradicts: { color: '#ef4444', label: 'Contradicts', icon: '✗' },
  context: { color: '#3b82f6', label: 'Contextual', icon: '~' },
  unresolved: { color: '#6b7280', label: 'Unresolved', icon: '?' },
};
