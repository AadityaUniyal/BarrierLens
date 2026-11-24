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
        className={`${iconDimensions} relative rounded-lg bg-gradient-to-br from-[#0d1527] via-[#09101d] to-[#04070c] border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.25)] flex items-center justify-center p-1.5 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]`}
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

          {/* Left Barrier Arc (Electric Google Blue #3b82f6) */}
          <path
            d="M 12 3 C 7 3 3 7 3 12 C 3 17 7 21 12 21"
            stroke="#3b82f6"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Right Focusing Lens Arc (Cyan #06b6d4) */}
          <path
            d="M 12 3 C 17 3 21 7 21 12 C 21 17 17 21 12 21"
            stroke="#06b6d4"
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
          Barrier<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Lens</span>
        </span>
        {showBadge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-300">
            v2.0
          </span>
        )}
      </div>
    </div>
  );
};
