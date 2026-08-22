/**
 * NYASA Indian Fake News Reporting Portal Component
 * Provides clean, interactive instructions for reporting suspicious content in India.
 */

import { useState } from 'react';

interface ReportFakePageProps {
  claimText: string;
  onBack: () => void;
}

export default function ReportFakePage({ claimText, onBack }: ReportFakePageProps) {
  const [copiedText, setCopiedText] = useState<'email' | 'whatsapp' | null>(null);

  const copyToClipboard = (text: string, type: 'email' | 'whatsapp') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-nyasa-text-dim hover:text-nyasa-text transition-colors cursor-pointer bg-transparent border-0 py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Verification Report
        </button>
      </div>

      {/* Hero Badge */}
      <div className="glass-card p-6 bg-nyasa-surface border-l-4 border-l-nyasa-contradicted">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-nyasa-contradicted/10 flex items-center justify-center text-nyasa-contradicted shrink-0 text-xl">
            🇮🇳
          </div>
          <div>
            <h2 className="text-headline-small text-nyasa-text">Report Suspicious Information</h2>
            <p className="text-body-medium text-nyasa-text-muted mt-1 leading-relaxed">
              In India, public authorities and fact-checking bodies maintain official channels to report online misinformation and digital threats.
            </p>
          </div>
        </div>
      </div>

      {/* Claim Summary Card */}
      <div className="glass-card p-5 bg-nyasa-card">
        <span className="text-label-small text-nyasa-text-dim uppercase tracking-wider block mb-1 font-mono-tech">Content Context</span>
        <p className="text-body-medium text-nyasa-text font-medium leading-relaxed italic">
          "{claimText}"
        </p>
      </div>

      {/* Reporting Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Route 1: PIB Fact Check */}
        <div className="glass-card p-6 bg-nyasa-surface flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <h3 className="text-title-medium text-nyasa-text">PIB Fact Check Unit</h3>
            </div>
            <p className="text-xs text-nyasa-text-dim leading-snug font-mono-tech">
              PRESS INFORMATION BUREAU
            </p>
            <p className="text-body-medium text-nyasa-text-muted leading-relaxed">
              Handles misinformation concerning the Government of India, central ministries, departments, policies, and public sector undertakings (PSUs).
            </p>
          </div>

          <div className="mt-6 space-y-3 pt-4 border-t border-nyasa-border">
            {/* Email Contact */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-nyasa-border bg-nyasa-bg/50">
              <div className="min-w-0">
                <span className="text-nyasa-text-dim block text-[10px] uppercase font-mono-tech">Email</span>
                <span className="font-semibold text-nyasa-text truncate block">socialmedia@pib.gov.in</span>
              </div>
              <button
                onClick={() => copyToClipboard('socialmedia@pib.gov.in', 'email')}
                className="px-2.5 py-1 text-[10px] font-mono-tech font-bold rounded-lg border border-nyasa-border bg-nyasa-surface hover:bg-nyasa-card-hover transition-colors cursor-pointer shrink-0"
              >
                {copiedText === 'email' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            {/* WhatsApp Contact */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-nyasa-border bg-nyasa-bg/50">
              <div className="min-w-0">
                <span className="text-nyasa-text-dim block text-[10px] uppercase font-mono-tech">WhatsApp Helpline</span>
                <span className="font-semibold text-nyasa-text truncate block">+91 87997 1259</span>
              </div>
              <button
                onClick={() => copyToClipboard('+918799711259', 'whatsapp')}
                className="px-2.5 py-1 text-[10px] font-mono-tech font-bold rounded-lg border border-nyasa-border bg-nyasa-surface hover:bg-nyasa-card-hover transition-colors cursor-pointer shrink-0"
              >
                {copiedText === 'whatsapp' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            {/* Portal Link */}
            <a
              href="https://factcheck.pib.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full py-2.5 px-4 text-center rounded-xl bg-nyasa-primary text-white font-semibold text-xs hover:bg-nyasa-primary-glow transition-all duration-200 shadow-sm shadow-nyasa-primary/10 hover:shadow-md cursor-pointer"
            >
              Access PIB Fact Check Portal
            </a>
          </div>
        </div>

        {/* Route 2: National Cyber Crime */}
        <div className="glass-card p-6 bg-nyasa-surface flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <h3 className="text-title-medium text-nyasa-text">Cyber Crime Portal</h3>
            </div>
            <p className="text-xs text-nyasa-text-dim leading-snug font-mono-tech">
              MINISTRY OF HOME AFFAIRS
            </p>
            <p className="text-body-medium text-nyasa-text-muted leading-relaxed">
              For online abuses, fake social-media handles, WhatsApp scams, Telegram group scams, phishing websites, and general cyber threats.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-nyasa-border space-y-4">
            <div className="p-3.5 rounded-xl border border-nyasa-border bg-nyasa-bg/50">
              <span className="text-[10px] font-bold text-nyasa-text-dim uppercase tracking-wider block mb-1 font-mono-tech">Actionable Data</span>
              <p className="text-xs text-nyasa-text-muted leading-relaxed">
                Save full screenshot proofs, web URLs, phone numbers, or account IDs before reporting to enable rapid tracking.
              </p>
            </div>

            <a
              href="https://www.cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 px-4 text-center rounded-xl border border-nyasa-primary text-nyasa-primary font-semibold text-xs hover:bg-nyasa-primary-muted transition-all duration-200 cursor-pointer"
            >
              Report at cybercrime.gov.in
            </a>
          </div>
        </div>
      </div>

      {/* Protocol Instructions */}
      <div className="glass-card p-6 bg-nyasa-surface">
        <h3 className="text-title-medium text-nyasa-text mb-4">Guidelines for Effective Reporting</h3>
        <ul className="space-y-3 text-body-medium text-nyasa-text-muted list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-nyasa-text">Attach Media Proof:</strong> Include the original image/video or screenshots of the WhatsApp forwards.
          </li>
          <li>
            <strong className="text-nyasa-text">Specify Metadata:</strong> Mention where you received it (e.g. WhatsApp group, public post link, private message).
          </li>
          <li>
            <strong className="text-nyasa-text">Note Context mismatch:</strong> Clearly explain why the context claims are misleading or false based on the evidence provided by NYASA.
          </li>
        </ul>
      </div>
    </div>
  );
}
