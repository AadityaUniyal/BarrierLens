'use client';

import React, { useState } from 'react';

export default function AccNameWCAGFixturePage() {
  const [mutationCount, setMutationCount] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('System Idle: Awaiting user action');
  const [mutations, setMutations] = useState<string[]>([]);

  const handleTriggerMutation = () => {
    const nextCount = mutationCount + 1;
    setMutationCount(nextCount);
    setStatusText(`Status changed: Profile updated successfully (event #${nextCount})`);
    setMutations(prev => [...prev, `Dynamic telemetry element #${nextCount} injected`]);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col items-center p-8 font-sans">
      <header className="w-full max-w-4xl flex justify-between items-center pb-4 mb-8 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BarrierLens Test Fixture</h1>
          <p className="text-sm text-white/50">Week 3 Automated Verification Fixture (AccName, Contrast, Target Size)</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0a84ff]/15 border border-[#0a84ff]/30 text-[#0a84ff]">
          Milestone 5
        </span>
      </header>

      <main className="w-full max-w-4xl flex flex-col gap-8">
        {/* Section 1: AccName Empty & Poor Names */}
        <section className="bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl" id="section-accname">
          <h2 className="text-xl font-semibold tracking-tight mb-2">1. W3C Accessible Name &amp; Diagnostics</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            Deterministic test fixtures exercising empty names, poor labels, broken IDREFs, generic links, and the Step 2A hidden element bypass exception.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            {/* 1.1 Unlabeled icon only */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">
                Unlabeled Icon Only (UNLABELED_ICON_ONLY)
              </span>
              <button
                id="btn-unlabeled-icon"
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#0a84ff]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </button>
            </div>

            {/* 1.2 Empty button no content */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">
                Empty Button (MISSING_LABEL_NO_SOURCES)
              </span>
              <button
                id="btn-empty-no-content"
                className="w-12 min-h-[40px] rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#0a84ff]"
              />
            </div>

            {/* 1.3 Broken aria-labelledby */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">
                Broken aria-labelledby (BROKEN_ARIA_LABELLEDBY)
              </span>
              <button
                id="btn-broken-labelledby"
                aria-labelledby="non-existent-id"
                className="min-h-[40px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#0a84ff]"
              />
            </div>

            {/* 1.4 Generic text */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">
                Generic Text (GENERIC_NON_DESCRIPTIVE)
              </span>
              <button
                id="btn-generic-text"
                className="min-h-[40px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#0a84ff]"
              >
                click here
              </button>
            </div>

            {/* 1.5 Image without alt */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">Image Missing Alt (EMPTY_IMAGE_NO_ALT)</span>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img
                id="img-no-alt"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='40'%3E%3Crect width='44' height='40' rx='8' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23888' font-size='11' dy='.3em'%3EIMG%3C/text%3E%3C/svg%3E"
                className="rounded-lg"
              />
            </div>

            {/* 1.6 Valid aria-labelledby */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">Valid aria-labelledby</span>
              <div className="flex items-center gap-2">
                <span id="label-part-1" className="text-sm text-[#0a84ff]">Add to</span>
                <span id="label-part-2" className="text-sm text-[#0a84ff]">Wishlist</span>
                <button
                  id="btn-valid-labelledby"
                  aria-labelledby="label-part-1 label-part-2"
                  className="min-h-[40px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* 1.7 Step 2A hidden reference bypass */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/50">Step 2A Hidden Ref Bypass</span>
              <div>
                <span id="hidden-text" style={{ display: 'none' }}>Hidden Action Text</span>
                <button
                  id="btn-hidden-ref"
                  aria-labelledby="hidden-text"
                  className="min-h-[40px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Static WCAG 1.4.3 Contrast */}
        <section className="bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl" id="section-contrast">
          <h2 className="text-xl font-semibold tracking-tight mb-2">2. WCAG 1.4.3 Color Contrast (Minimum)</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            Mathematical relative luminance evaluation covering failing normal text contrast (4.47:1), passing text (21:1), and semi-transparent alpha compositing.
          </p>

          <div className="flex flex-col gap-3.5">
            {/* Failing AA contrast */}
            <p
              id="contrast-failing"
              style={{
                color: '#777777',
                backgroundColor: '#ffffff',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.4,
                padding: '16px',
                borderRadius: '12px'
              }}
            >
              <strong>Failing Contrast Text (#777777 on #ffffff)</strong> — Calculated ratio ~4.47:1, which is below the WCAG 2 AA minimum threshold of 4.5:1 for normal body text.
            </p>

            {/* Passing AAA contrast */}
            <p
              id="contrast-passing"
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.4,
                padding: '16px',
                borderRadius: '12px'
              }}
            >
              <strong>Passing Contrast Text (#000000 on #ffffff)</strong> — Calculated ratio 21.0:1, exceeding both Level AA (4.5:1) and Level AAA (7.0:1) thresholds.
            </p>

            {/* Semi-transparent alpha compositing */}
            <p
              id="contrast-alpha"
              style={{
                color: 'rgba(0, 0, 0, 0.7)',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.4,
                padding: '16px',
                borderRadius: '12px'
              }}
            >
              <strong>Semi-transparent Text (rgba(0,0,0,0.7) on #ffffff)</strong> — Requires Porter-Duff alpha blending to evaluate true perceived luminance.
            </p>
          </div>
        </section>

        {/* Section 3: Static WCAG 2.2 2.5.8 Target Size */}
        <section className="bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl" id="section-target-size">
          <h2 className="text-xl font-semibold tracking-tight mb-2">3. WCAG 2.2 2.5.8 Target Size (Minimum)</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            Evaluation of the 24x24 CSS pixel minimum target size, 24px clearance circle spacing exception, and inline text link exception.
          </p>

          <div className="flex flex-col gap-5">
            {/* Failing dense targets */}
            <div>
              <div className="text-xs text-white/50 mb-2">
                Dense Undersized Targets (&lt; 24px and &lt; 2px spacing, fails base size and spacing exception):
              </div>
              <div className="flex items-center gap-[1px]">
                <button
                  id="target-failing-dense"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: '#ff453a',
                    color: '#ffffff',
                    fontSize: '10px',
                    lineHeight: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  X
                </button>
                <button
                  id="target-neighbor-dense"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: '#ff9f0a',
                    color: '#ffffff',
                    fontSize: '10px',
                    lineHeight: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  Y
                </button>
              </div>
            </div>

            {/* Passing spacing exception */}
            <div>
              <div className="text-xs text-white/50 mb-2">
                Isolated Undersized Target (16x16px with &gt; 12px clearance, passes Spacing Exception):
              </div>
              <div className="p-12 bg-white/[0.04] rounded-xl inline-block">
                <button
                  id="target-passing-spacing"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: '#30d158',
                    color: '#ffffff',
                    fontSize: '10px',
                    lineHeight: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  S
                </button>
              </div>
            </div>

            {/* Passing standard size */}
            <div>
              <div className="text-xs text-white/50 mb-2">
                Standard Interactive Target (32x32px &gt;= 24x24px, passes base size):
              </div>
              <button
                id="target-passing-standard"
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  minHeight: '32px',
                  padding: 0,
                  border: 'none',
                  background: '#0a84ff',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                32
              </button>
            </div>

            {/* Inline exception */}
            <div>
              <div className="text-xs text-white/50 mb-2">
                Inline Link Exception (target inside continuous prose, exempt):
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                This paragraph demonstrates standard document flow with an{' '}
                <a
                  id="target-inline-link"
                  href="#inline"
                  style={{ color: '#0a84ff', textDecoration: 'underline', display: 'inline' }}
                >
                  inline link target
                </a>{' '}
                embedded inside a sentence of continuous text.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Injected Observer & ARIA Live Telemetry */}
        <section className="bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl" id="section-observer">
          <h2 className="text-xl font-semibold tracking-tight mb-2">4. Injected Observer &amp; ARIA Live Telemetry</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            Dynamic elements testing client-side event capture: focus movements (focusin/focusout) and DOM mutations in ARIA live regions with microsecond timestamps.
          </p>

          <div className="flex flex-col gap-3.5">
            <div
              id="live-status-region"
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-white/[0.06] border border-white/10 text-sm"
            >
              <span className="status-msg">{statusText}</span>
            </div>

            <div>
              <button
                id="btn-trigger-mutation"
                onClick={handleTriggerMutation}
                className="px-4 py-2.5 rounded-xl bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold text-sm transition-colors"
              >
                Update Status
              </button>
            </div>

            <div id="mutation-container" className="flex flex-col gap-1.5 mt-2">
              {mutations.map((item, idx) => (
                <div
                  key={idx}
                  className="mutation-badge text-xs text-[#30d158] bg-[#30d158]/15 border border-[#30d158]/30 px-2.5 py-1 rounded-lg inline-block self-start"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
