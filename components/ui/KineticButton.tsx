'use client';

import React from 'react';

interface KineticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  variant?: 'mint' | 'lavender' | 'amber' | 'antigravity';
  icon?: React.ReactNode;
}

export function KineticButton({
  children,
  text,
  variant = 'antigravity',
  icon,
  className = '',
  disabled,
  ...props
}: KineticButtonProps) {
  const variantStyles = {
    mint: 'border-[var(--color-accent,#7eac81)] text-[var(--color-accent,#7eac81)] hover:bg-[var(--color-accent,#7eac81)]',
    lavender: 'border-[var(--color-accentTwo,#bb7bfc)] text-[var(--color-accentTwo,#bb7bfc)] hover:bg-[var(--color-accentTwo,#bb7bfc)]',
    amber: 'border-[var(--color-accentThree,#dad45e)] text-[var(--color-accentThree,#dad45e)] hover:bg-[var(--color-accentThree,#dad45e)]',
    antigravity: 'border-blue-500/40 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-full px-5 py-2.5',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`btn-tailord group rounded-none active:scale-[0.98] ${variantStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 font-serif text-lg sm:text-xl tracking-tight">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{text || children}</span>
      </span>

      {/* Orbiting Rotating Circles (Tailor'd Signature) */}
      <span className="circles shrink-0" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-current">
          <circle cx="12" cy="4" r="2.2" fill="currentColor" />
          <circle cx="20" cy="12" r="2.2" fill="currentColor" opacity="0.8" />
          <circle cx="12" cy="20" r="2.2" fill="currentColor" opacity="0.6" />
          <circle cx="4" cy="12" r="1.8" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </button>
  );
}
