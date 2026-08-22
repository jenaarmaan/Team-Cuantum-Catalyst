/**
 * NYASA Analysis Progress
 * Animated step-by-step progress indicator during verification.
 */

import { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Extracting claim', icon: '📝', duration: 2000 },
  { label: 'Analyzing media', icon: '🔍', duration: 3000 },
  { label: 'Searching evidence', icon: '🌐', duration: 4000 },
  { label: 'Classifying evidence', icon: '📊', duration: 2000 },
  { label: 'Checking context', icon: '🕐', duration: 2000 },
  { label: 'Calculating confidence', icon: '⚖️', duration: 1500 },
  { label: 'Generating explanation', icon: '💡', duration: 2000 },
];

export default function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto py-12">
      {/* Pulsing NYASA logo */}
      <div className="flex justify-center mb-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nyasa-primary to-nyasa-primary-glow
                        flex items-center justify-center animate-pulse-glow">
          <span className="text-3xl font-bold text-white">N</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, i) => (
          <div
            key={step.label}
            className={`
              flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500
              ${i < currentStep
                ? 'bg-nyasa-supported/5 border border-nyasa-supported/20'
                : i === currentStep
                  ? 'bg-nyasa-primary/5 border border-nyasa-primary/30 animate-fade-in-up'
                  : 'opacity-30'
              }
            `}
          >
            <span className="text-xl w-8 text-center">
              {i < currentStep ? '✓' : step.icon}
            </span>
            <span className={`font-medium ${i < currentStep ? 'text-nyasa-supported' : i === currentStep ? 'text-nyasa-primary' : 'text-nyasa-text-dim'}`}>
              {step.label}
            </span>
            {i === currentStep && (
              <div className="ml-auto flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-nyasa-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-nyasa-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-nyasa-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-nyasa-text-dim mt-8">
        NYASA is investigating multiple independent signals...
      </p>
    </div>
  );
}
