/**
 * NYASA — Evidence-Based Media & Claim Verification Intelligence
 *
 * NYASA doesn't tell you what to believe.
 * It shows you why something may or may not deserve your trust.
 */

import { useState } from 'react';
import type { VerificationResponse } from './types/verification';
import { STANCE_CONFIGS } from './types/verification';
import { submitVerification } from './services/api';
import UploadBox from './components/UploadBox';
import AnalysisProgress from './components/AnalysisProgress';
import AssessmentCard from './components/AssessmentCard';
import EvidenceCard from './components/EvidenceCard';
import MediaAnalysis from './components/MediaAnalysis';
import PillarsPanel from './components/PillarsPanel';
import UncertaintyPanel from './components/UncertaintyPanel';
import './index.css';

type AppState = 'input' | 'loading' | 'result' | 'error';

function App() {
  const [state, setState] = useState<AppState>('input');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (claim: string, image: File | null) => {
    setState('loading');
    setError('');
    try {
      const response = await submitVerification(claim, image);
      setResult(response);
      setState('result');

      // Save to history in localStorage
      const history = JSON.parse(localStorage.getItem('nyasa_history') || '[]');
      history.unshift({
        id: response.verification_id,
        claim: claim.slice(0, 100),
        label: response.assessment.display_label,
        confidence: response.assessment.confidence_percent,
        timestamp: response.timestamp,
        hasMedia: response.has_media,
      });
      localStorage.setItem('nyasa_history', JSON.stringify(history.slice(0, 20)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('input');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-nyasa-border/50 bg-nyasa-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nyasa-primary to-nyasa-primary-glow
                            flex items-center justify-center shadow-lg shadow-nyasa-primary/20
                            group-hover:shadow-nyasa-primary/40 transition-shadow">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold text-nyasa-text tracking-tight">NYASA</span>
          </button>
          <p className="text-xs text-nyasa-text-dim hidden sm:block">
            Evidence-Based Verification Intelligence
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* ── INPUT STATE ── */}
        {state === 'input' && (
          <div className="animate-fade-in-up">
            {/* Hero */}
            <div className="text-center mb-12 pt-8">
              <h1 className="text-4xl md:text-5xl font-bold text-nyasa-text mb-4 tracking-tight">
                Can you <span className="bg-gradient-to-r from-nyasa-primary to-nyasa-primary-glow bg-clip-text text-transparent">trust</span> this?
              </h1>
              <p className="text-lg text-nyasa-text-muted max-w-xl mx-auto leading-relaxed">
                Upload suspicious media or paste a claim. NYASA investigates the evidence,
                confidence and uncertainty — so you can make a better decision before sharing.
              </p>
              <p className="text-sm text-nyasa-text-dim mt-3">
                No TRUE/FALSE verdicts. Only evidence-backed assessments.
              </p>
            </div>

            {/* Upload Box */}
            <UploadBox onSubmit={handleSubmit} isLoading={false} />

            {/* How it works */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: '📝', title: 'Extract', desc: 'Identify the core claim and entities' },
                { icon: '🔍', title: 'Analyze', desc: 'Check media authenticity & context separately' },
                { icon: '🌐', title: 'Verify', desc: 'Retrieve independent web evidence' },
                { icon: '⚖️', title: 'Explain', desc: 'Show confidence, uncertainty & evidence' },
              ].map((step) => (
                <div key={step.title} className="glass-card p-5 text-center">
                  <span className="text-2xl mb-3 block">{step.icon}</span>
                  <h3 className="font-semibold text-nyasa-text text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-nyasa-text-dim">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {state === 'loading' && <AnalysisProgress />}

        {/* ── ERROR STATE ── */}
        {state === 'error' && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-nyasa-contradicted/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-nyasa-text mb-3">Verification Error</h2>
            <p className="text-nyasa-text-muted mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-nyasa-primary text-white font-medium
                         hover:bg-nyasa-primary-glow transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── RESULT STATE ── */}
        {state === 'result' && result && (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-nyasa-text-dim hover:text-nyasa-text transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              New verification
            </button>

            {/* Claim being verified */}
            <div className="glass-card p-5 animate-fade-in-up">
              <p className="text-xs text-nyasa-text-dim uppercase tracking-wider mb-2">Claim under verification</p>
              <p className="text-nyasa-text font-medium">"{result.claim_text}"</p>
              {result.extracted_claim.location && (
                <div className="flex gap-3 mt-3 text-xs text-nyasa-text-dim">
                  {result.extracted_claim.location && <span>📍 {result.extracted_claim.location}</span>}
                  {result.extracted_claim.time_reference && <span>🕐 {result.extracted_claim.time_reference}</span>}
                  {result.extracted_claim.event_type && <span>📌 {result.extracted_claim.event_type}</span>}
                </div>
              )}
            </div>

            {/* Primary Assessment */}
            <AssessmentCard assessment={result.assessment} uncertainty={result.uncertainty} />

            {/* Why — Explanation */}
            <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold text-nyasa-text mb-3 flex items-center gap-2">
                <span className="text-nyasa-primary">💡</span> Why?
              </h3>
              <p className="text-sm text-nyasa-text-muted leading-relaxed mb-4">
                {result.explanation}
              </p>
              {result.key_findings.length > 0 && (
                <div className="space-y-2">
                  {result.key_findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-nyasa-text-muted">
                      <span className="text-nyasa-primary shrink-0 mt-0.5">▸</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* The 6 Pillars of NYASA */}
            <PillarsPanel pillars={result.pillars} />

            {/* Media Analysis (if image was provided) */}
            {result.media_analysis && (
              <MediaAnalysis analysis={result.media_analysis} />
            )}

            {/* Evidence Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {[
                { label: 'Supporting', count: result.supporting_count, color: STANCE_CONFIGS.supports.color },
                { label: 'Contradicting', count: result.contradicting_count, color: STANCE_CONFIGS.contradicts.color },
                { label: 'Contextual', count: result.context_count, color: STANCE_CONFIGS.context.color },
                { label: 'Unresolved', count: result.unresolved_count, color: STANCE_CONFIGS.unresolved.color },
              ].map((s) => (
                <div
                  key={s.label}
                  className="glass-card p-4 text-center"
                  style={{ borderColor: `${s.color}20` }}
                >
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-xs text-nyasa-text-dim">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Evidence Cards */}
            {result.evidence.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-nyasa-text mb-4 flex items-center gap-2">
                  <span>📋</span> Evidence
                </h3>
                <div className="space-y-3">
                  {result.evidence.map((item, i) => (
                    <EvidenceCard key={item.evidence_id} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Uncertainty */}
            <UncertaintyPanel uncertainty={result.uncertainty} />

            {/* Recommended Action */}
            <div className="glass-card p-6 animate-fade-in-up border-nyasa-primary/20" style={{ animationDelay: '600ms' }}>
              <h3 className="text-lg font-semibold text-nyasa-text mb-3 flex items-center gap-2">
                <span>🎯</span> Recommended Action
              </h3>
              <p className="text-sm text-nyasa-text-muted">{result.recommended_action}</p>
            </div>

            {/* Limitations */}
            {result.limitations.length > 0 && (
              <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <h3 className="text-sm font-semibold text-nyasa-text-dim mb-3">Limitations</h3>
                <div className="space-y-2">
                  {result.limitations.map((lim, i) => (
                    <p key={i} className="text-xs text-nyasa-text-dim flex items-start gap-2">
                      <span className="shrink-0">⚬</span> {lim}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Scoring Transparency */}
            <div className="text-center py-6">
              <p className="text-[11px] text-nyasa-text-dim/60 max-w-lg mx-auto leading-relaxed">
                {result.scoring_note}
              </p>
              <p className="text-[10px] text-nyasa-text-dim/40 mt-2">
                Verification ID: {result.verification_id} · {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-nyasa-border/30 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-nyasa-text-dim">
            NYASA — Evidence-Based Verification Intelligence · Track: TRUST — Can you know what's real?
          </p>
          <p className="text-[10px] text-nyasa-text-dim/50 mt-1">
            NYASA doesn't tell you what to believe. It shows you why something may or may not deserve your trust.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
