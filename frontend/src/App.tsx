/**
 * NYASA — Evidence-Based Media & Claim Verification Intelligence
 *
 * NYASA doesn't tell you what to believe.
 * It shows you why something may or may not deserve your trust.
 */

import { useState, useEffect } from 'react';
import type { VerificationResponse } from './types/verification';
import { submitVerification } from './services/api';
import UploadBox from './components/UploadBox';
import AnalysisProgress from './components/AnalysisProgress';
import MediaAnalysis from './components/MediaAnalysis';
import PillarsPanel from './components/PillarsPanel';
import UncertaintyPanel from './components/UncertaintyPanel';
import EvidenceCard from './components/EvidenceCard';
import ProblemScenario from './components/ProblemScenario';
import ComparisonTable from './components/ComparisonTable';
import PipelineDiagram from './components/PipelineDiagram';
import './index.css';

type AppState = 'input' | 'loading' | 'result' | 'error';
type ThemeMode = 'system' | 'light' | 'dark';

function App() {
  const [state, setState] = useState<AppState>('input');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [theme, setTheme] = useState<ThemeMode>('system');

  // Theme Controller Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Handle system preference change listener
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

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

  const scrollToAnalyzer = () => {
    document.getElementById('analyzer-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get active signals count (non-unavailable, non-N/A) for convergence display
  const getActiveSignalsCount = (res: VerificationResponse) => {
    const active = res.pillars.filter(
      p => p.applicable && p.status !== 'UNAVAILABLE' && p.status !== 'UNKNOWN'
    ).length;
    return `${active}/6 signals verified`;
  };

  return (
    <div className="min-h-screen bg-nyasa-bg text-nyasa-text transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-nyasa-border bg-nyasa-surface sticky top-0 z-50 shadow-xs transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2 group cursor-pointer bg-transparent border-0">
            <div className="w-8 h-8 rounded-lg bg-nyasa-primary flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-nyasa-text tracking-tight flex items-center">
              NYASA<span className="text-nyasa-primary ml-0.5">Verification</span>
            </span>
          </button>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={handleReset} className="text-sm font-medium text-nyasa-primary bg-nyasa-primary-muted px-3 py-1.5 rounded-lg cursor-pointer">
              Home
            </button>
            <a href="#problem-section" className="text-sm font-medium text-nyasa-text-dim hover:text-nyasa-text transition-colors">Why Context</a>
            <a href="#comparison-section" className="text-sm font-medium text-nyasa-text-dim hover:text-nyasa-text transition-colors">Watermarks vs. NYASA</a>
            <a href="#diagram-section" className="text-sm font-medium text-nyasa-text-dim hover:text-nyasa-text transition-colors">How It Works</a>
            <button onClick={scrollToAnalyzer} className="text-sm font-medium text-nyasa-text-dim hover:text-nyasa-text transition-colors cursor-pointer bg-transparent border-0">
              Verify File
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* ── 1. INPUT/LANDING STATE ── */}
        {state === 'input' && (
          <div className="space-y-4">
            
            {/* HERO SECTION */}
            <section className="text-center py-16 md:py-24 relative overflow-hidden rounded-3xl border border-nyasa-border bg-nyasa-surface shadow-xs px-6">
              {/* Subtle radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-nyasa-primary/5 blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                {/* Technical Monospace Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-nyasa-primary/20 bg-nyasa-primary-muted text-[10px] font-bold uppercase tracking-wider text-nyasa-primary font-mono-tech mb-6">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-nyasa-primary animate-pulse"></span>
                  Multi-Signal Context Engine
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-nyasa-text mb-6 tracking-tight leading-tight max-w-3xl mx-auto">
                  <span className="text-nyasa-primary">NYASA verifies if you can trust the claim.</span>
                </h1>
                
                <p className="text-sm md:text-md text-nyasa-text-muted max-w-xl mx-auto leading-relaxed mb-8">
                  Assessing media authenticity is more than watermarking. NYASA fuses file diagnostics, 
                  EXIF metadata, C2PA cryptographic lineage, visual forensicts, and web evidence to determine if media matches its claim.
                </p>

                <button 
                  onClick={scrollToAnalyzer}
                  className="px-8 py-3.5 bg-nyasa-primary hover:bg-nyasa-primary-glow text-white font-bold rounded-xl text-md transition-all duration-300 shadow-md shadow-nyasa-primary/20 hover:shadow-nyasa-primary/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Verify Media & Claim
                </button>
              </div>
            </section>

            {/* 2. THE PROBLEM SCENARIO */}
            <section id="problem-section" className="border-t border-nyasa-border pt-6">
              <ProblemScenario />
            </section>

            {/* 3. COMPARISON TABLE */}
            <section id="comparison-section" className="border-t border-nyasa-border pt-6">
              <ComparisonTable />
            </section>

            {/* 4. HOW IT WORKS: DIAGRAM */}
            <section id="diagram-section" className="border-t border-nyasa-border pt-6">
              <PipelineDiagram />
            </section>

            {/* 5. LIVE ANALYZER SECTION */}
            <section id="analyzer-section" className="border-t border-nyasa-border py-16">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold text-nyasa-text tracking-tight">Interactive Analyzer</h2>
                <p className="text-sm text-nyasa-text-dim mt-2">
                  Upload an image, video, or audio file, attach a claim, and NYASA's engine will evaluate its credibility.
                </p>
              </div>
              <UploadBox onSubmit={handleSubmit} isLoading={false} />
            </section>

          </div>
        )}

        {/* ── 2. LOADING STATE ── */}
        {state === 'loading' && <AnalysisProgress />}

        {/* ── 3. ERROR STATE ── */}
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
                         hover:bg-nyasa-primary-glow transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── 4. RESULT STATE ── */}
        {state === 'result' && result && (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-nyasa-text-dim hover:text-nyasa-text transition-colors mb-2 cursor-pointer bg-transparent border-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              New verification
            </button>

            {/* Claim being verified */}
            <div className="glass-card p-5 animate-fade-in-up bg-nyasa-surface">
              <p className="text-xs text-nyasa-text-dim uppercase tracking-wider mb-2 font-mono-tech">Claim under verification</p>
              <p className="text-nyasa-text font-bold text-md">"{result.claim_text}"</p>
              {result.extracted_claim.location && (
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-nyasa-text-dim font-mono-tech">
                  {result.extracted_claim.location && <span>📍 Location: {result.extracted_claim.location}</span>}
                  {result.extracted_claim.time_reference && <span>🕐 Time: {result.extracted_claim.time_reference}</span>}
                  {result.extracted_claim.event_type && <span>📌 Type: {result.extracted_claim.event_type}</span>}
                </div>
              )}
            </div>

            {/* glanceable assessment top panel */}
            <div className="glass-card p-6 bg-nyasa-surface border border-nyasa-border animate-fade-in-up grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Verdict column (4 cols) */}
              <div className="md:col-span-4 flex flex-col items-start text-left border-b md:border-b-0 md:border-r border-nyasa-border pb-4 md:pb-0 md:pr-6">
                <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-2 font-mono-tech">Assessment Label</span>
                <span className="px-3.5 py-1.5 rounded-xl font-extrabold text-sm flex items-center gap-2 border" style={{
                  backgroundColor: `${result.assessment.label === 'insufficient_evidence' || result.assessment.label === 'inconclusive' ? 'rgba(107, 114, 128, 0.1)' : result.assessment.label.includes('supported') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                  color: `${result.assessment.label === 'insufficient_evidence' || result.assessment.label === 'inconclusive' ? '#6b7280' : result.assessment.label.includes('supported') ? '#10b981' : '#ef4444'}`,
                  borderColor: `${result.assessment.label === 'insufficient_evidence' || result.assessment.label === 'inconclusive' ? 'rgba(107, 114, 128, 0.2)' : result.assessment.label.includes('supported') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  {result.assessment.display_label}
                </span>
                
                {/* Separate Media / Context indicators */}
                {result.media_integrity && (
                  <div className="mt-4 space-y-1.5 w-full">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-nyasa-text-dim">Media Authenticity:</span>
                      <span className="font-bold text-nyasa-text">{result.media_integrity.label.replace('_', ' ')}</span>
                    </div>
                    {result.context_integrity && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-nyasa-text-dim">Context Consistency:</span>
                        <span className="font-bold text-nyasa-text">{result.context_integrity.label.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confidence Meter column (3 cols) */}
              <div className="md:col-span-3 flex flex-col items-center border-b md:border-b-0 md:border-r border-nyasa-border pb-4 md:pb-0 md:px-4">
                <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider mb-2 font-mono-tech">Confidence Score</span>
                
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="34" className="stroke-nyasa-border fill-none" strokeWidth="6" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      className="stroke-nyasa-primary fill-none transition-all duration-1000 ease-out" 
                      strokeWidth="6" 
                      strokeDasharray="213" 
                      strokeDashoffset={213 - (213 * result.assessment.confidence_percent) / 100}
                    />
                  </svg>
                  <span className="absolute text-md font-extrabold text-nyasa-text">{result.assessment.confidence_percent}%</span>
                </div>
              </div>

              {/* ECS & Convergence column (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between text-left space-y-4 md:pl-6">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider block font-mono-tech">Credibility (ECS)</span>
                    <span className="text-2xl font-extrabold text-nyasa-text font-mono-tech">{result.assessment.ecs}/100</span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider block font-mono-tech">Uncertainty</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono-tech
                      ${result.uncertainty.level === 'low' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : result.uncertainty.level === 'moderate' 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-rose-50 text-rose-700'
                      }
                    `}>
                      {result.uncertainty.level}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-nyasa-border p-2.5 rounded-lg w-full flex items-center justify-between">
                  <span className="text-xs text-nyasa-text-dim font-medium">Evidence Convergence</span>
                  <span className="text-xs font-bold text-nyasa-primary font-mono-tech">
                    {getActiveSignalsCount(result)}
                  </span>
                </div>
              </div>

            </div>

            {/* Why — Explanation */}
            <div className="glass-card p-6 animate-fade-in-up bg-nyasa-surface" style={{ animationDelay: '100ms' }}>
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

            {/* The 6 Pillars of NYASA (expandable rows) */}
            <PillarsPanel pillars={result.pillars} claimText={result.claim_text} />

            {/* Media Analysis (if image was provided) */}
            {result.media_analysis && (
              <MediaAnalysis analysis={result.media_analysis} />
            )}

            {/* Evidence Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {[
                { label: 'Supporting', count: result.supporting_count, color: '#10b981' },
                { label: 'Contradicting', count: result.contradicting_count, color: '#ef4444' },
                { label: 'Contextual', count: result.context_count, color: '#3b82f6' },
                { label: 'Unresolved', count: result.unresolved_count, color: '#6b7280' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="glass-card p-4 text-center bg-nyasa-surface"
                  style={{ borderColor: `${s.color}20` }}
                >
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-xs text-nyasa-text-dim">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Evidence Cards */}
            {result.evidence.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-nyasa-text flex items-center gap-2">
                  <span>📋</span> Evidence List
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
            <div className="glass-card p-6 animate-fade-in-up bg-nyasa-surface border-nyasa-primary/20" style={{ animationDelay: '600ms' }}>
              <h3 className="text-lg font-semibold text-nyasa-text mb-3 flex items-center gap-2">
                <span>🎯</span> Recommended Action
              </h3>
              <p className="text-sm text-nyasa-text-muted leading-relaxed">{result.recommended_action}</p>
            </div>

            {/* Limitations */}
            {result.limitations.length > 0 && (
              <div className="glass-card p-5 animate-fade-in-up bg-nyasa-surface" style={{ animationDelay: '700ms' }}>
                <h3 className="text-sm font-semibold text-nyasa-text-dim mb-3">Limitations</h3>
                <div className="space-y-2">
                  {result.limitations.map((lim, i) => (
                    <p key={i} className="text-xs text-nyasa-text-dim flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">⚬</span> {lim}
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
      <footer className="border-t border-nyasa-border bg-nyasa-surface mt-16 py-12 text-left transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Logo & Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-nyasa-primary flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-nyasa-text tracking-tight">
                NYASA<span className="text-nyasa-primary ml-0.5">Verification</span>
              </span>
            </div>
            <p className="text-xs text-nyasa-text-muted leading-relaxed">
              NYASA is a six-pillar evidence-fusion media-authenticity engine. It verifies whether you can trust the context of what you're looking at, going deeper than standard cryptographic metadata signatures.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={handleReset} className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors cursor-pointer bg-transparent border-0">Home</button></li>
              <li><button onClick={scrollToAnalyzer} className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors cursor-pointer bg-transparent border-0 text-left">Verify Content</button></li>
              <li><a href="#problem-section" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Decoy Scenario</a></li>
              <li><a href="#diagram-section" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Architecture Flow</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#privacy" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Terms of Service</a></li>
              <li><a href="#disclaimer" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Disclaimers</a></li>
            </ul>
          </div>

          {/* Column 4: Appearance Dropdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Appearance</h4>
            <div className="relative">
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="w-full text-xs font-medium text-nyasa-text border border-nyasa-border bg-nyasa-surface rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-nyasa-primary transition-colors duration-200"
              >
                <option value="system">🖥️ System</option>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-nyasa-text-dim">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Row */}
        <div className="max-w-5xl mx-auto px-6 border-t border-nyasa-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-nyasa-text-dim">
            © 2020-2026 NYASAVerification.com · All rights reserved.
          </p>
          <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech">
            BUILT FOR IMAGE AUTHENTICITY
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
