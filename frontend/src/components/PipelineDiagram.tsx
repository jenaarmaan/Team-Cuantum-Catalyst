export default function PipelineDiagram() {
  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-2 animate-fade-in-up">
      {/* Narrative Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] font-bold tracking-widest text-nyasa-primary uppercase font-mono-tech border border-sky-100 bg-sky-50 px-3 py-1 rounded-full">
          The Pipeline Architecture
        </span>
        <h2 className="text-3xl font-bold text-nyasa-text mt-4 tracking-tight">
          Real-Time Six-Signal Verification Flow
        </h2>
        <p className="text-sm text-nyasa-text-muted mt-3 leading-relaxed">
          Watch the data pipeline activate. Visual and text claim inputs feed into parallel analysis layers before signal fusion.
        </p>
      </div>

      {/* SVG Container */}
      <div className="glass-card p-8 bg-white shadow-sm border border-nyasa-border flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Dots */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: 'radial-gradient(var(--color-nyasa-primary) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />

        <svg className="w-full max-w-[800px] h-auto font-sans" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            .node {
              transition: all 0.5s ease;
              animation: node-pulse 6s infinite;
            }
            .node-bg {
              fill: #ffffff;
              stroke: #e2e8f0;
              stroke-width: 1.5;
              transition: all 0.5s ease;
            }
            .node-text {
              fill: #475569;
              font-size: 11px;
              font-weight: 500;
            }
            .node-title {
              fill: #0f172a;
              font-size: 12px;
              font-weight: 700;
            }
            .mono-code {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              fill: #64748b;
            }
            .flow-line {
              stroke: #cbd5e1;
              stroke-width: 2;
              stroke-dasharray: 8 4;
              animation: line-flow 6s infinite linear;
            }
            
            /* Sequences */
            .seq-1 { animation-delay: 0s; }
            .seq-2 { animation-delay: 1.2s; }
            .seq-3 { animation-delay: 2.5s; }
            .seq-4 { animation-delay: 3.8s; }
            .seq-5 { animation-delay: 5.0s; }

            /* Keyframes */
            @keyframes node-pulse {
              0%, 100% {
                transform: scale(1);
              }
              5%, 25% {
                transform: scale(1.02);
              }
              30% {
                transform: scale(1);
              }
            }

            @keyframes line-flow {
              0% {
                stroke-dashoffset: 0;
                stroke: #0284c7;
              }
              50% {
                stroke-dashoffset: -20;
                stroke: #0284c7;
              }
              100% {
                stroke-dashoffset: -40;
                stroke: #cbd5e1;
              }
            }

            /* CSS Activations linked to delays */
            .act-1 { animation: act-1-fade 6s infinite; }
            .act-2 { animation: act-2-fade 6s infinite; }
            .act-3 { animation: act-3-fade 6s infinite; }
            .act-4 { animation: act-4-fade 6s infinite; }
            .act-5 { animation: act-5-fade 6s infinite; }

            @keyframes act-1-fade {
              0%, 100% { stroke: #0284c7; fill: rgba(2, 132, 199, 0.08); stroke-width: 2; }
              20% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
            }
            @keyframes act-2-fade {
              0%, 15% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
              20%, 45% { stroke: #0284c7; fill: rgba(2, 132, 199, 0.08); stroke-width: 2; }
              50% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
            }
            @keyframes act-3-fade {
              0%, 40% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
              45%, 65% { stroke: #0284c7; fill: rgba(2, 132, 199, 0.08); stroke-width: 2; }
              70% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
            }
            @keyframes act-4-fade {
              0%, 60% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
              65%, 85% { stroke: #0284c7; fill: rgba(2, 132, 199, 0.08); stroke-width: 2; }
              90% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
            }
            @keyframes act-5-fade {
              0%, 80% { stroke: #e2e8f0; fill: #ffffff; stroke-width: 1.5; }
              85%, 98% { stroke: #10b981; fill: rgba(16, 185, 129, 0.08); stroke-width: 2.5; }
            }
          `}</style>

          {/* ── STAGE 1: INPUT ── */}
          <g className="node seq-1" transform="translate(0, 0)">
            <rect className="node-bg act-1" x="320" y="20" width="160" height="50" rx="10" />
            <text className="node-title" x="400" y="40" textAnchor="middle">User Upload & Claim</text>
            <text className="node-text" x="400" y="56" textAnchor="middle">Image/Video + Text</text>
          </g>

          {/* Lines from Input to Analysis layers */}
          <path className="flow-line seq-1" d="M400 70 L400 100 M400 70 L180 130 M400 70 L620 130" />

          {/* ── STAGE 2: PIPELINES ── */}
          {/* Media Integrity (Left) */}
          <g className="node seq-2" transform="translate(0, 0)">
            <rect className="node-bg act-2" x="80" y="130" width="200" height="120" rx="12" />
            <text className="node-title" x="180" y="152" textAnchor="middle">Media Integrity</text>
            <text className="mono-code" x="180" y="172" textAnchor="middle">P1 · Provenance & EXIF</text>
            <text className="mono-code" x="180" y="190" textAnchor="middle">P2 · C2PA Credentials</text>
            <text className="mono-code" x="180" y="208" textAnchor="middle">P3 · Visual Forensics</text>
          </g>

          {/* Media Evidence (Middle) */}
          <g className="node seq-2" transform="translate(0, 0)">
            <rect className="node-bg act-2" x="300" y="130" width="200" height="120" rx="12" />
            <text className="node-title" x="400" y="152" textAnchor="middle">Consistency Checks</text>
            <text className="mono-code" x="400" y="180" textAnchor="middle">P4 · Temporal Consistency</text>
            <text className="mono-code" x="400" y="200" textAnchor="middle">P5 · Cross-Modal Sync</text>
          </g>

          {/* Claim Evidence (Right) */}
          <g className="node seq-2" transform="translate(0, 0)">
            <rect className="node-bg act-2" x="520" y="130" width="200" height="120" rx="12" />
            <text className="node-title" x="620" y="152" textAnchor="middle">Claim Verification</text>
            <text className="mono-code" x="620" y="190" textAnchor="middle">P6 · External Web Evidence</text>
          </g>

          {/* Lines to Fusion */}
          <path className="flow-line seq-2" d="M180 250 L380 320 M400 250 L400 320 M620 250 L420 320" />

          {/* ── STAGE 3: EVIDENCE FUSION ── */}
          <g className="node seq-3" transform="translate(0, 0)">
            <rect className="node-bg act-3" x="300" y="320" width="200" height="60" rx="10" />
            <text className="node-title" x="400" y="344" textAnchor="middle">Evidence Fusion</text>
            <text className="node-text" x="400" y="360" textAnchor="middle">Dynamic Signal Weighted Graph</text>
          </g>

          {/* Line to Assessment */}
          <path className="flow-line seq-3" d="M400 380 L400 420" />

          {/* ── STAGE 4: ASSESSMENT & UNCERTAINTY ── */}
          <g className="node seq-4" transform="translate(0, 0)">
            <rect className="node-bg act-4" x="250" y="420" width="300" height="60" rx="12" />
            <text className="node-title" x="400" y="442" textAnchor="middle">Assessment & Uncertainty</text>
            <text className="node-text" x="400" y="458" textAnchor="middle">7-Class Verdict · ECS Score · Uncertainty reasons</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
