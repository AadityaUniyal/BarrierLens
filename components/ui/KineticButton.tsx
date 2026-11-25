'use client';

import React, { useRef, useState } from 'react';

interface KineticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  variant?: 'primary' | 'antigravity' | 'mint' | 'outline' | 'kinetic';
  icon?: React.ReactNode;
}

export function KineticButton({
  children,
  text,
  variant = 'primary',
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}: KineticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const variantStyles = {
    primary:
      'bg-white text-slate-950 hover:bg-slate-100 border border-slate-200/20 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(255,255,255,0.2)]',
    antigravity:
      'border-blue-500/40 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 font-semibold',
    mint:
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 font-semibold shadow-sm',
    outline:
      'bg-white/[0.04] text-white hover:bg-white/[0.08] border border-white/10 hover:border-white/20 font-medium',
    kinetic:
      'bg-[#090b10] text-white border border-white/15 hover:border-blue-400/50 font-semibold shadow-lg shadow-black/50',
  }[variant];

  return (
    <button
      ref={buttonRef}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-sans transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] overflow-hidden select-none min-h-[44px] ${variantStyles} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {/* Dynamic pointer spotlight reflection flare */}
      {isHovered && !disabled && (
        <span
          className="pointer-events-none absolute -inset-px rounded-full opacity-60 transition-opacity duration-300"
          style={{
            background: `radial-gradient(100px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.18), transparent 80%)`,
          }}
        />
      )}

      {/* Orbiting pulse glyph for kinetic mode */}
      {variant === 'kinetic' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-0.5" />
      )}

      {icon && <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
      <span className="relative z-10 font-medium tracking-tight">{text || children}</span>
    </button>
  );
}
