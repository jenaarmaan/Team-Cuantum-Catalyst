/**
 * NYASA Confidence Meter
 * Circular SVG ring showing the NYASA Confidence Score.
 */

import { useEffect, useState } from 'react';

interface ConfidenceMeterProps {
  percent: number;
  color: string;
  size?: number;
}

export default function ConfidenceMeter({ percent, color, size = 120 }: ConfidenceMeterProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 300);
    return () => clearTimeout(timer);
  }, [percent]);

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.5s ease-out',
            filter: `drop-shadow(0 0 6px ${color}50)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {animatedPercent}%
        </span>
        <span className="text-[10px] text-nyasa-text-dim uppercase tracking-wider mt-0.5">
          Confidence
        </span>
      </div>
    </div>
  );
}
