'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function KeyboardTrapFixturePage() {
  const [isOpen, setIsOpen] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const promoInputRef = useRef<HTMLInputElement>(null);
  const applyBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation replicating classic sink SCC trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Intercept Escape: do not dismiss!
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }

      // Tab forward cycling
      if (e.key === 'Tab' && !e.shiftKey) {
        if (document.activeElement === cancelBtnRef.current) {
          e.preventDefault();
          promoInputRef.current?.focus();
        }
      }

      // Shift+Tab backward cycling
      if (e.key === 'Tab' && e.shiftKey) {
        if (document.activeElement === promoInputRef.current) {
          e.preventDefault();
          cancelBtnRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  const handleOpenDialog = () => {
    setIsOpen(true);
    setTimeout(() => {
      promoInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col items-center p-8 font-sans">
      <header className="w-full max-w-3xl flex justify-between items-center pb-4 mb-8 border-b border-white/10">
        <nav aria-label="Main Navigation" className="flex gap-6">
          <Link href="#home" id="nav-home" className="text-[#0a84ff] text-[15px] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0a84ff]">
            Store Home
          </Link>
          <Link href="#specials" id="nav-specials" className="text-[#0a84ff] text-[15px] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0a84ff]">
            Special Offers
          </Link>
          <Link href="#support" id="nav-support" className="text-[#0a84ff] text-[15px] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0a84ff]">
            Customer Support
          </Link>
        </nav>
        <span className="text-xs text-white/40">BarrierLens M3 Test Fixture</span>
      </header>

      <main className="w-full max-w-3xl bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Holiday Special Promotion</h1>
        <p className="text-[15px] text-white/60 leading-relaxed mb-6">
          Explore seasonal accessibility hardware and studio accessories. Claim your exclusive voucher code by opening the promotion dialog below.
        </p>

        <div className="flex gap-3 mb-8">
          <button
            id="open-trap-dialog-btn"
            onClick={handleOpenDialog}
            className="px-5 py-2.5 rounded-xl bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            Claim Discount Promo
          </button>
          <button
            id="continue-shopping-btn"
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            Continue Browsing
          </button>
        </div>

        {/* 
          Fixture A: Injected Keyboard Trap (Sink SCC with Disabled Escape)
          Traps Tab and Shift+Tab endlessly within [#promo-input, #promo-apply-btn, #promo-cancel-btn].
          Escape listener intercepts and prevents dismissal.
        */}
        {isOpen && (
          <dialog
            id="promo-trap-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            open
            className="relative mt-4 w-full max-w-md mx-auto block bg-[#242428] border border-rose-500/40 rounded-3xl p-8 shadow-2xl text-left"
          >
            <div className="inline-block px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Injected WCAG 2.1.2 Trap
            </div>
            <h2 id="dialog-title" className="text-xl font-semibold mb-2">Claim 50% Off Code</h2>
            <p className="text-sm text-white/60 leading-normal mb-5">
              Enter your verification code below to redeem. Notice: This dialog has intercepted keyboard dismissal to simulate a classic sink SCC keyboard trap.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              <label htmlFor="promo-input" className="text-xs font-medium text-white/60">
                Promotion Code
              </label>
              <input
                type="text"
                id="promo-input"
                ref={promoInputRef}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. BARRIERLENS50"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                id="promo-apply-btn"
                ref={applyBtnRef}
                onClick={(e) => {
                  e.preventDefault();
                  promoInputRef.current?.focus();
                }}
                className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
              >
                Apply Code
              </button>
              <button
                type="button"
                id="promo-cancel-btn"
                ref={cancelBtnRef}
                onClick={(e) => {
                  e.preventDefault();
                  setPromoCode('');
                  promoInputRef.current?.focus();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium hover:bg-rose-500/30 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
              >
                Cancel
              </button>
            </div>
          </dialog>
        )}
      </main>
    </div>
  );
}
