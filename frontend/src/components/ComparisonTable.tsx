export default function ComparisonTable() {
  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-2 animate-fade-in-up">
      {/* Narrative Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] font-bold tracking-widest text-nyasa-primary uppercase font-mono-tech border border-nyasa-primary/20 bg-nyasa-primary-muted px-3 py-1 rounded-full">
          Capabilities Comparison
        </span>
        <h2 className="text-headline-medium text-nyasa-text mt-4">
          How NYASA Compares
        </h2>
        <p className="text-body-medium text-nyasa-text-muted mt-3">
          Comparing SynthID, C2PA, and NYASA's multi-signal verification engine across key fact-checking dimensions.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="glass-card overflow-hidden bg-white dark:bg-nyasa-surface shadow-sm border border-nyasa-border rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-nyasa-border bg-slate-50/50 dark:bg-slate-900/30">
                <th className="p-4 text-xs font-bold text-nyasa-text uppercase tracking-wider font-mono-tech w-1/4">Verification Metric</th>
                <th className="p-4 text-xs font-bold text-nyasa-text uppercase tracking-wider font-mono-tech w-1/4">Google SynthID</th>
                <th className="p-4 text-xs font-bold text-nyasa-text uppercase tracking-wider font-mono-tech w-1/4">C2PA Standard</th>
                <th className="p-4 text-xs font-bold text-nyasa-primary uppercase tracking-wider font-mono-tech w-1/4 bg-nyasa-primary-muted/20">NYASA Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nyasa-border text-sm">
              
              <tr>
                <td className="p-4 font-semibold text-nyasa-text">Primary Purpose</td>
                <td className="p-4 text-nyasa-text-muted">AI generated content detection</td>
                <td className="p-4 text-nyasa-text-muted">Cryptographic asset lineage</td>
                <td className="p-4 text-nyasa-text-muted bg-nyasa-primary-muted/10">Evidence-based claim verification</td>
              </tr>
              
              <tr>
                <td className="p-4 font-semibold text-nyasa-text">How It Works</td>
                <td className="p-4 text-nyasa-text-muted">Embeds imperceptible pixel/frame watermarks</td>
                <td className="p-4 text-nyasa-text-muted">Signs metadata packets on capture/edit</td>
                <td className="p-4 text-nyasa-text-muted bg-nyasa-primary-muted/10">Fuses 6 media & context signal pillars</td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-nyasa-text">Resists Stripping?</td>
                <td className="p-4 text-nyasa-text-muted">Yes (survives compression/crops)</td>
                <td className="p-4 text-nyasa-text-muted">No (often stripped by social media)</td>
                <td className="p-4 text-nyasa-text-muted bg-nyasa-primary-muted/10">Yes (analyzes visual scene & context web data)</td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-nyasa-text">Detects Re-contexting?</td>
                <td className="p-4 text-nyasa-text-muted">No (signed files still lie)</td>
                <td className="p-4 text-nyasa-text-muted">No (valid signatures pass)</td>
                <td className="p-4 text-emerald-700 font-bold bg-nyasa-primary-muted/10">Yes (cross-checks location, date & stance)</td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-nyasa-text">Analyzes Audio/Video?</td>
                <td className="p-4 text-nyasa-text-muted">Yes (SynthID-Text, Voice, Play)</td>
                <td className="p-4 text-nyasa-text-muted">Yes (supported across assets)</td>
                <td className="p-4 text-nyasa-text-muted bg-nyasa-primary-muted/10">Yes (Temporal & Cross-Modal evaluation)</td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-nyasa-text">Output Format</td>
                <td className="p-4 text-nyasa-text-muted">Binary (AI / Not AI classification)</td>
                <td className="p-4 text-nyasa-text-muted">Lineage manifest timeline</td>
                <td className="p-4 text-nyasa-primary font-semibold bg-nyasa-primary-muted/10 font-mono-tech">
                  Structured Convergence & Uncertainty index
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
