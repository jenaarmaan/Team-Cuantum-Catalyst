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
      <header className="border-b border-nyasa-border bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2 group">
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
            <button onClick={handleReset} className="text-sm font-medium text-nyasa-primary bg-sky-50 px-3 py-1.5 rounded-lg">Home</button>
            <a href="#faqs" className="text-sm font-medium text-nyasa-text-muted hover:text-nyasa-text transition-colors">FAQs</a>
            <a href="#blog" className="text-sm font-medium text-nyasa-text-muted hover:text-nyasa-text transition-colors">Blog</a>
            <a href="#about" className="text-sm font-medium text-nyasa-text-muted hover:text-nyasa-text transition-colors">About</a>
            <a href="#contact" className="text-sm font-medium text-nyasa-text-muted hover:text-nyasa-text transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* ── INPUT STATE ── */}
        {state === 'input' && (
          <div className="animate-fade-in-up">
            {/* Hero */}
            <div className="text-center mb-10 pt-6">
              {/* Technical Monospace Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-100 bg-sky-50/50 text-[11px] font-bold uppercase tracking-wider text-nyasa-primary font-mono-tech mb-4">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-nyasa-primary animate-pulse"></span>
                FREE & INSTANT ANALYSIS
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-nyasa-text mb-4 tracking-tight leading-none">
                Fake Image <span className="text-nyasa-primary">Detector</span>
              </h1>
              <p className="text-md text-nyasa-text-muted max-w-xl mx-auto leading-relaxed">
                Expose manipulated and AI-generated images in seconds with a four-layer 
                forensic pipeline: <strong>AI detection</strong>, <strong>metadata analysis</strong>, 
                <strong>Error Level Analysis (ELA)</strong> and <strong>context verification</strong>.
              </p>
            </div>

            {/* Upload Box */}
            <UploadBox onSubmit={handleSubmit} isLoading={false} />

            {/* Sub-header text matching reference */}
            <div className="text-center mt-16 mb-8">
              <h2 className="text-xl font-bold text-nyasa-text mb-2">Everything you need to verify an image</h2>
              <p className="text-sm text-nyasa-text-muted">A complete forensic toolkit: free, private, and fast enough for everyday fact-checking.</p>
            </div>

            {/* 4-Column Feature Cards matching reference */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  icon: (
                    <svg className="w-5 h-5 text-nyasa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  ),
                  title: 'AI Image Detection', 
                  desc: 'Identifies forensic artifacts commonly left by AI image generators, including Midjourney, DALL-E, and Stable Diffusion.' 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5 text-nyasa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Metadata Analysis', 
                  desc: 'Extracts EXIF metadata, embedded headers, software signatures, timestamps, GPS information, and camera device configurations.' 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5 text-nyasa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  ),
                  title: 'Error Level Analysis (ELA)', 
                  desc: 'Performs ELA by resaving the image at a known quality level and comparing errors to highlight edited or modified regions.' 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5 text-nyasa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: 'Privacy-First Processing', 
                  desc: 'Every uploaded image is analyzed entirely in memory and is never permanently stored on our servers. Your data is yours alone.' 
                },
              ].map((step) => (
                <div key={step.title} className="glass-card p-6 flex flex-col items-start text-left bg-white">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center mb-4 border border-sky-100/50">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-nyasa-text text-md mb-2">{step.title}</h3>
                  <p className="text-xs text-nyasa-text-muted leading-relaxed">{step.desc}</p>
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

      {/* Footer matching reference screenshot 1 */}
      <footer className="border-t border-nyasa-border bg-white mt-16 py-12 text-left">
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
              Free four-layer image forensics: AI detection, metadata analysis, 
              Error Level Analysis and watermark scanning to expose manipulated and 
              AI-generated images.
            </p>
            {/* Social Icons */}
            <div className="flex gap-2 pt-2">
              <a href="#twitter" className="w-8 h-8 rounded-lg border border-nyasa-border flex items-center justify-center hover:bg-sky-50 transition-colors text-xs text-nyasa-text-muted hover:text-nyasa-primary">X</a>
              <a href="#facebook" className="w-8 h-8 rounded-lg border border-nyasa-border flex items-center justify-center hover:bg-sky-50 transition-colors text-xs text-nyasa-text-muted hover:text-nyasa-primary">f</a>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#blog" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Blog</a></li>
              <li><a href="#faqs" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">FAQs</a></li>
              <li><a href="#about" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#privacy" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Terms & Conditions</a></li>
              <li><a href="#disclaimer" className="text-nyasa-text-muted hover:text-nyasa-primary transition-colors">Disclaimer</a></li>
            </ul>
          </div>

          {/* Column 4: Appearance Dropdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-nyasa-text-dim uppercase tracking-wider font-mono-tech mb-4">Appearance</h4>
            <div className="relative">
              <select className="w-full text-xs font-medium text-nyasa-text border border-nyasa-border rounded-lg px-3 py-2 bg-white appearance-none cursor-pointer focus:outline-none focus:border-nyasa-primary">
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
