'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function FocusLossFixturePage() {
  // Section 1: Item deletion (Focus Loss)
  const [itemExists, setItemExists] = useState(true);

  // Section 2: Composite Tablist Widget
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const tabRefs = [
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null)
  ];

  // Section 3: Compliant Accessible Modal
  const [modalOpen, setModalOpen] = useState(false);
  const openModalBtnRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const closeModalBtnRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIdx = index;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (index + 1) % tabRefs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (index - 1 + tabRefs.length) % tabRefs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = tabRefs.length - 1;
    } else {
      return;
    }

    setActiveTabIdx(nextIdx);
    tabRefs[nextIdx].current?.focus();
  };

  // Accessible Modal Escape Key and Focus Trap Handler
  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalOpen(false);
        // WCAG 2.1.2 requirement: restore focus to trigger button
        openModalBtnRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = [
          emailInputRef.current,
          closeModalBtnRef.current,
          saveBtnRef.current
        ].filter(Boolean) as HTMLElement[];

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [modalOpen]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    openModalBtnRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col items-center p-8 font-sans">
      <header className="w-full max-w-3xl flex justify-between items-center pb-4 mb-8 border-b border-white/10">
        <div className="text-lg font-semibold tracking-tight">System Preferences &amp; Workspace</div>
        <span className="text-xs text-white/40">BarrierLens M3 Test Fixture</span>
      </header>

      <main className="w-full max-w-3xl bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Focus Loss, Composite Widgets &amp; Compliant Modals</h1>
        <p className="text-[15px] text-white/60 leading-relaxed mb-8">
          Demonstrates three critical focus-graph behaviors: (1) focus loss fallback to <code className="text-rose-300">document.body</code> upon DOM deletion, (2) W3C ARIA composite widget roving tabindex navigation via arrow keys, and (3) an intentional accessible modal dialog that traps Tab while open, but closes on <code className="text-[#30d158]">Escape</code> and restores focus to its trigger button without false-positive trap flags.
        </p>

        {/* SECTION 1: Focus Loss on Item Deletion */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6" id="focus-loss-section">
          <h2 className="text-lg font-semibold mb-2">1. Dynamic DOM Removal (Focus Loss)</h2>
          <p className="text-xs text-white/60 mb-4">
            Clicking &quot;Delete Item&quot; removes the parent container from the DOM without calling <code className="text-rose-300">.focus()</code> on any replacement control. Focus immediately drops to <code className="text-rose-300">document.body</code>.
          </p>

          {itemExists ? (
            <div id="cart-item-container" className="flex justify-between items-center p-4 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <span className="font-medium">Hardware Security Key (FIDO2)</span>
                <span className="text-xs text-white/40 ml-2">SKU-99042</span>
              </div>
              <button
                id="delete-item-btn"
                onClick={() => {
                  setItemExists(false);
                  // Deliberately DO NOT set focus anywhere -> focus drops to document.body!
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium hover:bg-rose-500/30 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
                aria-label="Delete Security Key"
              >
                Delete Item
              </button>
            </div>
          ) : (
            <div id="deletion-notice" className="text-xs text-rose-400 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              Item container removed from DOM. Focus dropped to document.body!
            </div>
          )}
        </section>

        {/* SECTION 2: Composite Tablist Widget */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6" id="composite-widget-section">
          <h2 className="text-lg font-semibold mb-2">2. Composite Tablist Widget (Arrow Navigation)</h2>
          <p className="text-xs text-white/60 mb-4">
            Press <code className="text-[#0a84ff]">Tab</code> to enter the active tab stop. Use <code className="text-[#bf5af2]">ArrowRight</code> and <code className="text-[#bf5af2]">ArrowLeft</code> to cycle between tabs using roving tabindex.
          </p>

          <div className="inline-flex gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl mb-4" role="tablist" aria-label="Account Settings Tabs">
            <button
              id="tab-1"
              ref={tabRefs[0]}
              role="tab"
              aria-selected={activeTabIdx === 0}
              aria-controls="panel-1"
              tabIndex={activeTabIdx === 0 ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 0)}
              onClick={() => setActiveTabIdx(0)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff] ${
                activeTabIdx === 0 ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              General
            </button>
            <button
              id="tab-2"
              ref={tabRefs[1]}
              role="tab"
              aria-selected={activeTabIdx === 1}
              aria-controls="panel-2"
              tabIndex={activeTabIdx === 1 ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 1)}
              onClick={() => setActiveTabIdx(1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff] ${
                activeTabIdx === 1 ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Security
            </button>
            <button
              id="tab-3"
              ref={tabRefs[2]}
              role="tab"
              aria-selected={activeTabIdx === 2}
              aria-controls="panel-3"
              tabIndex={activeTabIdx === 2 ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 2)}
              onClick={() => setActiveTabIdx(2)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff] ${
                activeTabIdx === 2 ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Notifications
            </button>
          </div>

          <div className="p-4 bg-black/20 rounded-xl text-sm text-white/70">
            {activeTabIdx === 0 && <div id="panel-1" role="tabpanel" aria-labelledby="tab-1">General account profile and regional locale settings.</div>}
            {activeTabIdx === 1 && <div id="panel-2" role="tabpanel" aria-labelledby="tab-2">Two-factor authentication credentials and session tokens.</div>}
            {activeTabIdx === 2 && <div id="panel-3" role="tabpanel" aria-labelledby="tab-3">Push notifications and email digest subscription options.</div>}
          </div>
        </section>

        {/* SECTION 3: Intentional Compliant Modal Dialog */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6" id="modal-section">
          <h2 className="text-lg font-semibold mb-2">3. Intentional Accessible Modal (WCAG 2.1.2 Compliant)</h2>
          <p className="text-xs text-white/60 mb-4">
            Traps Tab internally while open, but provides an accessible Close button and closes on <code className="text-[#30d158]">Escape</code>, returning focus to the trigger button. Must NOT be flagged as a trap!
          </p>

          <button
            id="open-acc-modal-btn"
            ref={openModalBtnRef}
            onClick={handleOpenModal}
            className="px-5 py-2.5 rounded-xl bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            Open Preferences Modal
          </button>

          {modalOpen && (
            <dialog
              id="accessible-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="acc-modal-title"
              open
              className="relative mt-4 w-full max-w-md mx-auto block bg-[#242428] border border-[#30d158]/40 rounded-3xl p-8 shadow-2xl text-left"
            >
              <div className="inline-block px-2.5 py-1 rounded-full bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] text-xs font-semibold uppercase tracking-wider mb-3">
                WCAG 2.1.2 Compliant Modal
              </div>
              <h3 id="acc-modal-title" className="text-xl font-semibold mb-2">Workspace Preferences</h3>
              <p className="text-sm text-white/60 leading-normal mb-5">
                Configure your workspace privacy settings. Press Escape or click Close to dismiss; focus will return to the trigger button.
              </p>

              <div className="flex flex-col gap-2 mb-6">
                <label htmlFor="acc-email-input" className="text-xs font-medium text-white/60">
                  Notification Email
                </label>
                <input
                  type="email"
                  id="acc-email-input"
                  ref={emailInputRef}
                  defaultValue="user@apple.cupertino"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  id="close-acc-modal-btn"
                  ref={closeModalBtnRef}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
                >
                  Close
                </button>
                <button
                  type="button"
                  id="save-acc-btn"
                  ref={saveBtnRef}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
                >
                  Save Changes
                </button>
              </div>
            </dialog>
          )}
        </section>
      </main>
    </div>
  );
}
