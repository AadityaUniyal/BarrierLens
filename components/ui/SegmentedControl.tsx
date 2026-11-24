'use client';

import React, { useRef, useState, useEffect } from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const activeIndex = options.findIndex((opt) => opt.id === value);

  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-segment]');
    const activeButton = buttons[activeIndex];
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeIndex, options]);

  const sizeClasses = {
    sm: 'text-xs p-0.5 h-8',
    md: 'text-xs p-1 h-9',
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center bg-white/[0.04] border border-white/10 rounded-xl select-none ${sizeClasses} ${className}`}
      role="tablist"
    >
      {/* Apple Hardware Sliding Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white/[0.12] border border-white/[0.18] rounded-lg shadow-sm backdrop-blur-md transition-all duration-260 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
        aria-hidden="true"
      />

      {/* Buttons */}
      {options.map((option) => {
        const isActive = option.id === value;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            data-segment
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex-1 px-3 py-1 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors duration-150 focus-visible:outline-none ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{option.label}</span>
            {option.badge && (
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
