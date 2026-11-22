import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }[size];

  const textStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Precision Dual-Lens Optical Aperture Mark */}
      <div
        className={`${iconDimensions} relative rounded-lg bg-gradient-to-br from-[#0c121e] via-[#080d16] to-[#04070c] border border-white/10 shadow-[0_2px_10px_rgba(0,144,255,0.15)] flex items-center justify-center p-1.5 transition-all duration-300 group-hover:border-[#0090ff]/40 group-hover:shadow-[0_0_15px_rgba(0,144,255,0.25)]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Ambient Inner Refraction Ring */}
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.25"
            strokeDasharray="2 3"
          />

          {/* Left Barrier Arc (Electric Cobalt #0090ff) */}
          <path
            d="M 12 3 C 7 3 3 7 3 12 C 3 17 7 21 12 21"
            stroke="#0090ff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Right Focusing Lens Arc (Emerald #10b981) */}
          <path
            d="M 12 3 C 17 3 21 7 21 12 C 21 17 17 21 12 21"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="16 4"
          />

          {/* Center Focal Pupil & Light Ray */}
          <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
          <line
            x1="12"
            y1="7"
            x2="12"
            y2="17"
            stroke="#ffffff"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold tracking-[-0.03em] text-white ${textStyles} font-sans`}
        >
          Barrier<span className="text-[#0090ff]">Lens</span>
        </span>
        {showBadge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-400">
            v2.0
          </span>
        )}
      </div>
    </div>
  );
};
