---
name: tactile-micro-interactions
description: Engineering and design doctrines for tactile, physics-based micro-interactions, sliding pills, spotlight raytracing, and keyboard-first accessibility.
---

# Tactile Micro-Interactions & Physics-First Frontend Doctrine

This doctrine sets the mandatory engineering and sensory standards for high-precision tactile interfaces in BarrierLens, mirroring the craftsmanship of Apple, Linear, and Vercel.

## 1. Sliding Segmented Controls (macOS / iOS Physics)

Segmented controls must feel like continuous physical hardware rather than discrete button swaps.

### Core Principles
1. **Single Moving Pill Indicator**:
   - Use an absolute-positioned indicator (`bg-white/[0.08]` or `bg-white/[0.12]`) that slides smoothly between options.
   - Do NOT toggle background colors independently on each button; track the active element's bounding rect or relative offset.
2. **Transition Curve**:
   - Never use linear or bouncy cartoon springs.
   - Standard cubic-bezier: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple responsive deceleration curve).
   - Duration: `240ms` to `280ms`.
3. **Contrast & Focus**:
   - Inactive labels: `text-neutral-400 hover:text-neutral-200`.
   - Active label: `text-white font-medium`.
   - Clear focus-visible ring: `focus-visible:ring-1 focus-visible:ring-blue-500/50`.

---

## 2. Dynamic Spotlight Cards (Subtle Optical Flare)

Cards and interactive panels should react to spatial cursor presence without intrusive glow or generic purple blur.

### Coordinate Math & CSS Gradients
1. **Local Space Tracking**:
   - Track cursor coordinates relative to card bounds (`e.clientX - rect.left`, `e.clientY - rect.top`).
   - Store dynamically as CSS variables: `--mouse-x: ${x}px; --mouse-y: ${y}px`.
2. **Double-Layer Structure**:
   - **Base Layer**: Card background (`bg-[#0d0e12]/80` or `bg-neutral-900/60`) with hairline border (`border-white/[0.06]`).
   - **Spotlight Radial Overlay**:
     ```css
     radial-gradient(
       400px circle at var(--mouse-x, 0) var(--mouse-y, 0),
       rgba(0, 144, 255, 0.12),
       transparent 70%
     )
     ```
   - **Border Highlight**: Pointer-following border glow (`border-transparent` with mask or subtle radial border overlay).
3. **Restraint Rules**:
   - Opacity when mouse leaves: fade out gracefully with `opacity 0.4s ease`.
   - No blinding saturated halos. Max core opacity: `0.15`.

---

## 3. Keyboard-First Master-Detail Inspections

Professional tools must be entirely operable without mouse interaction.

### Navigation Contract
- `j` / `ArrowDown`: Move selection to next item.
- `k` / `ArrowUp`: Move selection to previous item.
- `Space`: Toggle interactive split-screen diff or visual preview.
- `Enter`: Trigger primary action on selected item (e.g. Generate PR, Autofix).
- `v`: Trigger instant automated verification / rescan.
- `Escape`: Clear detail view / close modal.

### Safeguards
- Always ignore hotkeys when user is typing inside `input`, `textarea`, or `[contenteditable]`.
- Provide an accessible floating or docked **Hotkeys HUD** at the bottom of the inspector showing available keys (`[j/k] navigate`, `[space] diff`, `[enter] fix`).

---

## 4. Typography & Spatial Rhythm

- Monospace numbers for counters, latency, and line positions: `font-mono tracking-tight`.
- WCAG AA contrast ratio minimum `4.5:1` for all body text; `3.0:1` for large headers.
- Hairline architectural dividers: `border-white/[0.06]` to `border-white/[0.08]`. Never solid opaque heavy borders.
