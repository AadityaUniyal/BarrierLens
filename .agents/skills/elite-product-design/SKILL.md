---
name: elite-product-design
description: Human-crafted, production-grade UI/UX design doctrine. Prevents AI-generated visual tropes, enforces Linear/Apple/Vercel craftsmanship, bespoke branding, atmospheric watermarks, and spacious spatial hierarchy.
---

# Elite Product Design & Brand Doctrine (Anti-AI-Slop)

This skill defines the visual, atmospheric, and architectural design standards for BarrierLens. Every component, landing section, modal, and application view must strictly follow these rules to ensure the product feels like a premier, venture-backed human engineering tool—never an "AI-generated template".

---

## 1. The Anti-AI-Slop Manifesto (What to NEVER Do)

| AI-Generated Cliché | Why It Looks Cheap / AI-Generated | The Human Brand Rule |
| :--- | :--- | :--- |
| **Purple/Pink Giant Blur Orbs** | Generic Midjourney/Figma template aesthetic | Restrained dark obsidian (`#07080b`, `#0b0d13`) with subtle 1px borders (`border-white/[0.08]`) and a single purposeful accent (Cobalt `#0070f3` or Emerald `#10b981`). |
| **Generic Sparkle Icons (`✨`)** | Plastered everywhere on AI wrappers | Never use sparkle icons unless explicitly triggering an LLM reasoning strand. Prefer functional technical glyphs (`Terminal`, `GitPullRequest`, `ShieldCheck`, `Cpu`). |
| **Buzzword Hero Copy** | *"Supercharge your workflow with next-gen AI"* | Concrete, pain-focused engineering copy: *"Prove what locks them out. Fix it before you ship."* |
| **Symmetrical Rule-of-3 Cards** | Identical 3-column cards with generic icons in colored squares | Asymmetrical Bento grids (e.g., 2-column wide live cockpit card + 1-column stats card), showing real code and live data. |
| **Low-Contrast Gray-on-Gray** | Fails accessibility and feels washed out | Crisp white headings (`#f8fafc`, `font-semibold`), high-contrast body (`#cbd5e1`), and intentional muted labels (`#64748b`). |
| **Cluttered Cockpit Overload** | 20 graphs and debug toggles on one screen | Clear separation: **Executive View** (high-level compliance score, top failing journeys, 1-click PR) vs. **Diagnostic Lab** (AST diffs, Tarjan SCC graphs). |

---

## 2. Brand Identity & Visual Atmosphere

### 2.1 The Bespoke Logo Mark (Dual-Lens Refraction)
Never use a generic font icon for the primary logo. The BarrierLens logo consists of:
* A precision geometric SVG mark: Intersecting rounded square apertures with a central focal pupil and an emerald/cyan optical beam.
* Typography: Bold sans-serif with geometric tracking:
  ```tsx
  <span className="font-semibold tracking-[-0.03em] text-white text-base">
    Barrier<span className="text-[#0090ff]">Lens</span>
  </span>
  ```

### 2.2 Background Watermark & Atmosphere
Instead of blank black or noisy gradients, apply an architectural watermark grid with subtle top-down lighting:
```css
/* Deep canvas background */
background-color: #07080b;

/* Subtle atmospheric lighting cone from top */
background-image: 
  radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0, 144, 255, 0.12), transparent 70%),
  radial-gradient(ellipse 40% 30% at 85% 10%, rgba(16, 185, 129, 0.05), transparent 60%);

/* Geometric architectural dot-matrix watermark (24px grid) */
background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
background-size: 24px 24px;
```

---

## 3. Landing Page Architecture (Conversion & Authority)

1. **Top Nav**:
   - Floating glass bar with 1px border (`bg-black/60 backdrop-blur-xl border-white/10`).
   - Left: Bespoke SVG logo. Center: Anchor links (`Proof Engine`, `How It Works`, `Benchmarks`, `Pricing`). Right: Live Status badge (`All Systems Operational`) + `Open Cockpit` CTA.
2. **Hero Section (Spacious & Punchy)**:
   - Top Pill: Subtle announcement pill with micro-dot (`Live: Tarjan SCC Keyboard Trap Engine`).
   - Main Headline: Massive, crisp, high-contrast typography (`text-5xl sm:text-7xl font-bold tracking-tight text-white`).
   - Value Proposition: Clear problem & outcome in 2 lines.
   - Dual CTAs: High-contrast primary button (`bg-white text-black hover:bg-slate-200`) + secondary interactive demo button.
3. **Interactive Proof Cockpit (Above the Fold)**:
   - A real, interactive interactive widget rather than a screenshot.
   - 4 Tabs: *Keyboard Path*, *Code Fix PR*, *Voice Transcript*, *Compliance Score*.
   - Allows users to interactively test keyboard traps and preview live AST patches before signing up.
4. **Bento Grid (Asymmetrical Value Proof)**:
   - 6 cards with varied spans (col-span-2 and col-span-1).
   - Card 1: Visual Reading Order (Kendall Tau ranking).
   - Card 2: Tarjan Directed Cycle Proof (mathematical graph cycle detection).
   - Card 3: Assistive Silence Detector (ARIA live region mutation gap).
   - Card 4: 1-Click Surgical GitHub PR.
   - Card 5: Porter-Duff Alpha Contrast Engine.
   - Card 6: VPAT & European Accessibility Act (EAA) Compliance Export.
5. **Interactive Benchmarks Section**:
   - 1-click test cards against intentional test fixtures (`Keyboard Trap Modal`, `Disordered Reading Grid`, `Focus Loss on Item Delete`).
6. **Transparent Pricing & Footer**:
   - Simple, human tiers (Community, Growth, Enterprise). Zero hidden sales walls.

---

## 4. Authentication Experience (Apple/Passkey Standard)

* **Modal-Based, Zero Disruption**: Never kick the user to an ugly unstyled `/login` page that loses their audit context.
* **Passkey / Biometric Primary**: Large, high-priority button (`Sign in with Apple Passkey / Touch ID`).
* **Secondary Social & Email**: GitHub and Google OAuth, plus passwordless magic-link option.
* **Truthful Error Affordances**: If a passkey is cancelled or rejected, display an accessible `role="alert"` banner with an immediate retry button.
* **Persistent Session State**: Keep user context synchronized without flickering page reloads.

---

## 5. Application Page Feel (Focus & Productivity)

* **Dual-Mode Workspace**:
  * **Executive Summary Mode**: High-level compliance health (e.g. `94% Grade A`), zero blocker indicator, legal risk assessment, and fast 1-click actions (*Export VPAT*, *Fix PR*).
  * **Diagnostic Lab Mode**: Unlocks full engineering cockpit (AST diffs, Tarjan cycle graphs, CDP Accessibility tree comparator, trace theater).
* **Master-Detail Layout**:
  * Left column: Clean list of findings with severity pills and WCAG tags.
  * Right column: Rich inspection pane showing the visual screenshot, DOM snippet, mathematical proof explanation, and verified diff.
* **Tactile Micro-Details**:
  * Monospace keyboard badges: `<kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300 border border-white/10">Tab</kbd>`.
  * Status indicator dots with subtle pulse rings for live services.
  * Instant Esc key handling on all drawers and modals.

---

## 6. CSS & Tailwind Design Tokens

* **Canvas**: `#07080b` (Deep Obsidian), `#0b0d13` (Elevated Surface), `#12151e` (Card Background).
* **Borders**: `border-white/[0.08]` (Default), `border-white/15` (Interactive/Hover), `border-[#0090ff]/30` (Active Focus).
* **Text**: `#f8fafc` (Primary White), `#94a3b8` (Secondary Slate), `#64748b` (Muted/Micro), `#0090ff` (Action Blue), `#10b981` (Verified Emerald).
* **Motion Easing**: `transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]`.
