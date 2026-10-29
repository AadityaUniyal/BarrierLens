'use client';

import React, { useState } from 'react';
import { AlertCircle, Lock, Trash2, ArrowRight, Check } from 'lucide-react';

export default function BenchmarkPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      // Injected Barrier: Silent visual error, NO aria-live, NO focus move!
      setErrorVisible(true);
    } else {
      setErrorVisible(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Target Benchmark Ground Truth Site
        </span>
        <h1 className="text-2xl font-bold text-white mt-2">
          BarrierLens Synthetic Accessibility Benchmark
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          This page injects 4 documented WCAG barriers (Keyboard Trap, Silent Error, Low Kendall τ Order, Unlabeled Control) for automated evaluation.
        </p>
      </div>

      <div className="space-y-8">
        {/* BARRIER 1: Keyboard Trap Modal */}
        <section className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            Flow 1: Subscription Confirmation (Injected Keyboard Trap)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Goal: Open confirmation dialog, confirm, and return focus to main content.
          </p>

          <button
            id="open-modal-btn"
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            Open Confirmation Dialog
          </button>

          {modalOpen && (
            <div
              id="trap-modal"
              className="mt-4 p-5 rounded-xl bg-slate-950 border border-rose-500/40 shadow-2xl relative"
            >
              <h3 className="text-sm font-semibold text-white">Confirm Checkout Subscription</h3>
              <p className="text-xs text-slate-400 mt-1">
                Notice: Focus is trapped internally; pressing Esc does not dismiss and Tab loops inside without escape.
              </p>

              <div className="flex items-center gap-3 mt-4">
                <input
                  id="modal-input-field"
                  type="text"
                  placeholder="Coupon code"
                  className="px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                />
                <button
                  id="modal-confirm-btn"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 text-white"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          )}
        </section>

        {/* BARRIER 2: Silent State Change Form */}
        <section className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Flow 2: Newsletter Sign-up (Injected Silent Error)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submitting empty input triggers visual error without aria-live or programmatic focus shift.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="benchmark-email" className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="benchmark-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white w-full max-w-sm"
              />
            </div>

            {errorVisible && (
              <div
                id="error-msg"
                className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 max-w-sm"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Email address is required to proceed.
              </div>
            )}

            {submitted && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 max-w-sm">
                <Check className="w-3.5 h-3.5" />
                Thank you for subscribing!
              </div>
            )}

            <button
              id="benchmark-submit-btn"
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Sign Up
            </button>
          </form>
        </section>

        {/* BARRIER 3: Discordant Reading Order (Low Kendall Tau) */}
        <section className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-base font-semibold text-white">
            Flow 3: Multicolumn Dashboard (Injected Low Kendall τ Order)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual reading order is Column 1 → Column 2 → Column 3, but positive tabindexes reverse this order.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-mono">Column 1 (Left)</span>
              <button
                tabIndex={3}
                id="btn-col-1"
                className="mt-2 w-full py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Action 1 (tabIndex=3)
              </button>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-mono">Column 2 (Center)</span>
              <button
                tabIndex={1}
                id="btn-col-2"
                className="mt-2 w-full py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Action 2 (tabIndex=1)
              </button>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-mono">Column 3 (Right)</span>
              <button
                tabIndex={2}
                id="btn-col-3"
                className="mt-2 w-full py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Action 3 (tabIndex=2)
              </button>
            </div>
          </div>
        </section>

        {/* BARRIER 4: Unlabeled Icon Button */}
        <section className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Flow 4: Cart Item Deletion</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Icon-only button has no aria-label, title, or alt text (empty accessible name).
            </p>
          </div>

          <button
            id="unlabeled-delete-btn"
            className="p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  );
}
