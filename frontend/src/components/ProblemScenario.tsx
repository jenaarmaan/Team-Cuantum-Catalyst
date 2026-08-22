import { useState } from 'react';

export default function ProblemScenario() {
  const [activeStep, setActiveStep] = useState<'meta' | 'c2pa' | 'nyasa'>('meta');

  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-2 animate-fade-in-up">
      {/* Narrative Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] font-bold tracking-widest text-nyasa-primary uppercase font-mono-tech border border-sky-100 bg-sky-50 px-3 py-1 rounded-full">
          The Decoy Scenario
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-nyasa-text mt-4 tracking-tight">
          Where Cryptography Fails, Context Lies
        </h2>
        <p className="text-sm text-nyasa-text-muted mt-3 leading-relaxed">
          Standard signatures like SynthID or C2PA prove media origin and integrity. 
          They cannot tell you if the claim attached to the media is true.
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Post Simulator (45% width) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl border border-nyasa-border bg-white shadow-sm relative overflow-hidden">
          {/* Simulated Post Header */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-nyasa-text/10 flex items-center justify-center font-bold text-sm text-nyasa-text-muted">
                TR
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-nyasa-text">TrendRadar_News</span>
                  <span className="text-sky-500 text-[10px] shrink-0">✓ Verified</span>
                </div>
                <span className="text-[10px] text-nyasa-text-dim block">Posted 2 hours ago</span>
              </div>
            </div>
            
            {/* The Lie */}
            <p className="text-sm font-semibold text-nyasa-text mb-3 leading-snug">
              "Breaking: Severe flash flooding submerges major streets in <span className="text-nyasa-contradicted underline decoration-2">Mysuru</span> city center today! Residents advised to seek high ground. 🚨🌊"
            </p>
          </div>

          {/* Simulated Image */}
          <div className="relative rounded-xl overflow-hidden aspect-video border border-nyasa-border mb-4 bg-slate-100 group">
            {/* Mock Image Content */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800')" }} />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Watermark Tag Mock */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-emerald-400 font-mono-tech flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              C2PA SIGNED
            </div>

            {/* Geographical Conflict tag */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-[10px] text-white/95 font-medium drop-shadow-md">
                📍 Claimed: Mysuru, India
              </span>
              <span className="text-[10px] text-red-400 font-bold bg-black/65 px-2 py-0.5 rounded font-mono-tech border border-red-500/30">
                FORENSIC TRACE: LAHORE, 2023
              </span>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
              <span className="font-mono-tech font-bold text-emerald-800">1. FILE INTEGRITY (C2PA)</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white font-mono-tech">
                VALID ORIGIN
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
              <span className="font-mono-tech font-bold text-emerald-800">2. METADATA EXIF ORIGIN</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white font-mono-tech">
                UNMODIFIED
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-red-50/80 border border-red-100">
              <span className="font-mono-tech font-bold text-red-900">3. CLAIM & CONTEXT VERIFICATION</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white font-mono-tech animate-pulse">
                CONTEXT MISMATCH
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Steps (75% width) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          
          {/* Step 1 */}
          <div 
            onClick={() => setActiveStep('meta')}
            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left
              ${activeStep === 'meta' 
                ? 'bg-sky-50/40 border-sky-200/80 shadow-xs' 
                : 'bg-white border-nyasa-border hover:bg-slate-50/50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                ${activeStep === 'meta' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-nyasa-text-muted'}
              `}>
                01
              </div>
              <h3 className="font-bold text-nyasa-text text-md">The Image File is Clean</h3>
            </div>
            <p className="text-xs text-nyasa-text-muted leading-relaxed pl-11">
              Camera metadata (EXIF) confirms the file is direct-from-sensor, unmodified, and captured by an authentic mobile device. It contains no edits or compression anomalies. Standard tools give it a <strong>green checkmark</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => setActiveStep('c2pa')}
            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left
              ${activeStep === 'c2pa' 
                ? 'bg-sky-50/40 border-sky-200/80 shadow-xs' 
                : 'bg-white border-nyasa-border hover:bg-slate-50/50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                ${activeStep === 'c2pa' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-nyasa-text-muted'}
              `}>
                02
              </div>
              <h3 className="font-bold text-nyasa-text text-md">The Cryptography is Valid</h3>
            </div>
            <p className="text-xs text-nyasa-text-muted leading-relaxed pl-11">
              A valid cryptographic manifest (C2PA / SynthID watermark) is embedded, proving it was created by a specific camera module. This makes digital manipulation impossible. Standard checkers pass it as <strong>100% verified origin</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => setActiveStep('nyasa')}
            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left
              ${activeStep === 'nyasa' 
                ? 'bg-sky-50/40 border-sky-200/80 shadow-xs' 
                : 'bg-white border-nyasa-border hover:bg-slate-50/50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                ${activeStep === 'nyasa' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-nyasa-text-muted'}
              `}>
                03
              </div>
              <h3 className="font-bold text-nyasa-text text-md">The Context is the Lie</h3>
            </div>
            <p className="text-xs text-nyasa-text-muted leading-relaxed pl-11">
              The image actually depicts a street in <strong>Lahore in 2023</strong>, reposted today to push a fake breaking news narrative about flooding in <strong>Mysuru</strong>. This is a <strong>contextual lie</strong>. 
              NYASA cross-checks internet source signals, reverse searches web databases, and maps evidence geographically to instantly catch the mismatch.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
