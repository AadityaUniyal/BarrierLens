'use client';

import React from 'react';

interface KineticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  variant?: 'primary' | 'antigravity' | 'mint' | 'outline';
  icon?: React.ReactNode;
}

export function KineticButton({
  children,
  text,
  variant = 'primary',
  icon,
  className = '',
  disabled,
  ...props
}: KineticButtonProps) {
  const variantStyles = {
    primary: 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-200/20 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
    antigravity: 'border-blue-500/40 text-white bg-blue-600 hover:bg-blue-500 shadow-md font-semibold',
    mint: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-semibold',
    outline: 'bg-white/[0.04] text-white hover:bg-white/[0.08] border border-white/10 font-medium',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-sans transition-all duration-200 active:scale-[0.98] ${variantStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{text || children}</span>
    </button>
  );
}
