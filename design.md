# Design Specification & Replication Blueprint: Tailor'd Design

> **Document Type:** Production Design System Specification (`design.md`)  
> **Source Target:** [https://www.tailord.design/](https://www.tailord.design/)  
> **Architecture:** Retro-Futuristic Cyber-Editorial / Analog Phosphor Tech-Noir  
> **Status:** Forensic Design System & Technical Implementation Manual

---

## 1. Aesthetic Identity & Core Design Philosophy

The visual signature of **Tailor’d Design** is rooted in a deliberate tension between **high-fashion editorial literature** and **1980s retro-computing CRT terminal hardware**. Rather than choosing between clean minimalism and rich cyberpunk atmospheric immersion, the interface harmonizes both:

1. **The Humanist / Editorial Layer:** High-contrast serif headlines using `Instrument Serif`, featuring italicized emphasis keywords that convey intellect, craftsmanship, and bespoke boutique authority.
2. **The Algorithmic / Terminal Layer:** Fixed-width tabular metrics, zero-padded ordinal counters (`01`, `02`, `03`...), and uppercase status tags rendered in `IBM Plex Mono`.
3. **The Analog Physics Layer:** Physical Cathode Ray Tube (CRT) raster shaders, subpixel chromatic aberration text shadows, scanning raster lines, analog film grain, and custom SVG ink displacement maps that make vector typography feel organic and stamped.
4. **Architectural Geometry:** Classical Roman arch frames (`portfolio-arch`) with curved semicircular crowns and flat bottoms, glowing phosphor halos, and tactile double-bordered buttons.

---

## 2. Color Palette & Atmospheric Design Tokens

Tailor’d Design rejects flat pitch-black (`#000000`) in favor of a warm, deep charcoal graphite (`#181717`) that mimics vintage phosphor display phosphors when powered on.

```
       ┌────────────────────────────────────────────────────────┐
       │               CANVAS FOUNDATION: #181717               │
       │    Radial Atmosphere: ellipse at 70% 0, #6153950c      │
       └───────────────────────────┬────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
  │--color-accent│          │--color-accent│          │--color-accent│
  │     MINT     │          │   LAVENDER   │          │    AMBER     │
  │   #7eac81    │          │   #bb7bfc    │          │   #dad45e    │
  └──────────────┘          └──────────────┘          └──────────────┘
```

### 2.1 Complete CSS Color Tokens
```css
:root {
  /* Canvas Foundations */
  --color-background: #181717;         /* Deep Warm Carbon / CRT Graphite */
  --color-grayBackground: #232323;     /* Form input & surface background */
  --bg: #181717;

  /* Text & Glyphs */
  --color-primary: #fffddb;            /* Warm Bone / Phosphor Cream (Main text) */
  --color-crt: #a9a9b6;                /* Silvery Lavender CRT text phosphor */
  --color-muted: #7ea18b;              /* Subdued Terminal Green */
  --color-highlight: #5ff77d;          /* Hyper-saturated Phosphor Green */

  /* Phosphor Accents (The Tri-Chromatic Matrix) */
  --color-accent: #7eac81;             /* Phosphor Terminal Mint */
  --color-accentTwo: #bb7bfc;          /* Phosphor Electric Ultraviolet / Lavender */
  --color-accentThree: #dad45e;        /* Phosphor Telemetry Amber / Solar Gold */

  /* Glow & Bloom Halos */
  --color-crtGlow: rgba(153, 255, 164, 0.61);    /* #99ffa49c Mint Text Bloom */
  --color-crtGlowBox: rgba(153, 255, 164, 0.12); /* #99ffa41f Box Diffusion */
  --color-lavenderGlow: rgba(210, 93, 255, 0.20);/* #d25dff33 Arch Hover Halo */

  /* Semantic State Overrides */
  --color-danger: oklch(70.4% 0.191 22.216);      /* #ff453a Warning Coral */
}
```

### 2.2 Dynamic Color-Mix & Phosphor Bloom Formulations
In the active `.crt-enabled` state, colors are dynamically synthesized using modern CSS `color-mix()`:
```css
/* Mint Box Glow */
box-shadow: 
  0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent),
  inset 0 0 20px color-mix(in srgb, var(--color-accent) 15%, transparent);

/* Lavender Box Glow */
box-shadow: 
  0 0 20px color-mix(in srgb, var(--color-accentTwo) 35%, transparent),
  inset 0 0 16px color-mix(in srgb, var(--color-accentTwo) 18%, transparent);

/* Amber Box Glow */
box-shadow: 
  0 0 20px color-mix(in srgb, var(--color-accentThree) 35%, transparent),
  inset 0 0 16px color-mix(in srgb, var(--color-accentThree) 18%, transparent);
```

---

## 3. Typography System & Optical Hierarchy

The typographic architecture relies on strict pairing: **Instrument Serif** for display elegance, and **IBM Plex Mono** for technical discipline.

### 3.1 Font Stacks
```css
/* Serif Display (Headings, Buttons, Quotes) */
--font-serif: "Instrument Serif", Georgia, serif;

/* Technical Monospace (Body, Form Labels, Telemetry, Counters) */
--font-mono: "IBM Plex Mono", Menlo, Courier, monospace;
```

### 3.2 Type Hierarchy Specifications

| Level | Font Stack | Size (Desktop / Mobile) | Line Height | Weight | Style & Letter-Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Giant** | `var(--font-serif)` | `clamp(3.5rem, 8vw, 6.5rem)` | `0.92` | `400` | Regular + Italic keywords | Hero Title |
| **Section H2** | `var(--font-serif)` | `var(--text-4xl)` (36px–44px) | `1.1` | `400` | Uppercase, `tracking-wide` | Section Headers, Arch Titles |
| **Module H3** | `var(--font-serif)` | `var(--text-2xl)` (24px–28px) | `1.2` | `400` | Normal | Service Titles, Modal Headings |
| **Button Text** | `var(--font-serif)` | `var(--text-2xl)` (24px) | `2.5rem` | `400` | Normal | Double-Border Buttons |
| **Body Paragraph** | `var(--font-mono)` | `var(--text-base)` (15px–16px) | `1.65` | `300` | Normal, Justified/Right | Narrative Prose, Bios |
| **Metadata / Badges**| `var(--font-mono)` | `var(--text-xs)` (11px–12px) | `1.4` | `400` | Uppercase, `tracking-widest`| Status Pills, Ordinal Numbers |

---

## 4. The Complete CRT Physics & Shader Raster Engine

Tailor’d Design achieves its retro-futuristic CRT hardware simulation through **five distinct optical layers**:

### 4.1 Layer 1: Hardware Scanlines (`body:before`)
A fixed, non-blocking viewport shader rendering 1px scanline rasters every 3px:
```css
.crt-enabled body:before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(3, 3, 12, 0.27) 0 1px,
    transparent 1px 3px
  );
  box-shadow: inset 0 0 70px rgba(2, 3, 11, 0.40);
  opacity: 0.7;
}
```

### 4.2 Layer 2: Film Grain Texture (`body:after`)
A microscopic fractal noise SVG tile blended with screen mode:
```css
.crt-enabled body:after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  opacity: 0.07;
  mix-blend-mode: screen;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

### 4.3 Layer 3: Chromatic Aberration & Text Phosphor Bloom
Simulates subpixel electron beam phase-shift on text:
```css
.crt-enabled :is(h1, h2, h3, h4, p, label, span, a, .font-mono, .font-serif) {
  text-shadow: 
    -0.7px 0 color-mix(in srgb, currentColor 50%, transparent),
     0.7px 0 color-mix(in srgb, currentColor 35%, transparent),
     0 0 13px color-mix(in srgb, currentColor 20%, transparent);
}
```

### 4.4 Layer 4: SVG Ink Distortion Filter (`#crt-ink`)
Displaces text contours slightly to simulate liquid print ink or electron beam bloom:
```html
<svg width="0" height="0" style="position: absolute; pointer-events: none;">
  <defs>
    <filter id="crt-ink" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="noise" />
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 1 0 0" in="grayNoise" result="grainAlpha" />
      <feComposite in="SourceGraphic" in2="grainAlpha" operator="in" result="inked" />
    </filter>
  </defs>
</svg>
```

### 4.5 Layer 5: Image Phosphor Shaders (`#crt-imageBlue` & `#crt-imageBlueHover`)
Transforms all raw client photography into monochromatic cyan-tinted phosphor displays that bloom on hover:
```html
<svg width="0" height="0" style="position: absolute; pointer-events: none;">
  <defs>
    <!-- Default Monochromatic Phosphor State -->
    <filter id="crt-imageBlue" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="mono" />
      <feComponentTransfer in="mono" result="contrast">
        <feFuncR type="gamma" amplitude="1.1" exponent=".78" offset="-.025" />
        <feFuncG type="gamma" amplitude="1.1" exponent=".78" offset="-.025" />
        <feFuncB type="gamma" amplitude="1.1" exponent=".78" offset="-.025" />
      </feComponentTransfer>
      <feTurbulence type="fractalNoise" baseFrequency=".83" numOctaves="1" seed="14" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" result="grain" />
      <feComposite in="contrast" in2="grain" operator="arithmetic" k1="0" k2="1" k3=".7" k4="-.35" result="noisy" />
      <feComponentTransfer in="noisy" result="stepped">
        <feFuncR type="discrete" tableValues="0 .14 .3 .5 .7 .86 1" />
        <feFuncG type="discrete" tableValues="0 .14 .3 .5 .7 .86 1" />
        <feFuncB type="discrete" tableValues="0 .14 .3 .5 .7 .86 1" />
      </feComponentTransfer>
      <feComponentTransfer in="stepped" result="phosphor">
        <feFuncR type="table" tableValues=".035 .17 .42 .7 .9" />
        <feFuncG type="table" tableValues=".035 .14 .36 .65 .85" />
        <feFuncB type="table" tableValues=".08 .28 .6 .88 1.0" />
      </feComponentTransfer>
    </filter>

    <!-- Interactive Saturated Hover State -->
    <filter id="crt-imageBlueHover" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="saturate" values="0.9" result="colorPass" />
      <feComponentTransfer in="colorPass" result="contrast">
        <feFuncR type="gamma" amplitude="1.0" exponent=".88" offset="0" />
        <feFuncG type="gamma" amplitude="1.0" exponent=".88" offset="0" />
        <feFuncB type="gamma" amplitude="1.0" exponent=".88" offset="0" />
      </feComponentTransfer>
      <feGaussianBlur in="contrast" stdDeviation="2" result="bloom" />
      <feComponentTransfer in="bloom" result="glow">
        <feFuncA type="linear" slope="0.3" />
      </feComponentTransfer>
      <feBlend in="contrast" in2="glow" mode="screen" />
    </filter>
  </defs>
</svg>
```

---

## 5. Architectural Geometry: The Roman Arch (`portfolio-arch`)

The central structural motif of Tailor’d Design is the **Roman Arch**: an arch with an infinite semicircular top radius and rectangular base.

```
       ┌────────────────────────┐
     /                            \   <-- Semicircular Crown
    |                              |
    |                              |   <-- Inset Shadow Mask
    |                              |
    |                              |
    └──────────────────────────────┘   <-- Flat Base (12px-16px)
```

### 5.1 CSS Architecture of `.portfolio-arch`
```css
.portfolio-arch {
  position: relative;
  overflow: hidden;
  /* Top corners use maximum scalar to guarantee a perfect semicircle */
  border-top-left-radius: 3.40282e38px;
  border-top-right-radius: 3.40282e38px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--color-crt) 60%, transparent);
  box-shadow: 
    0 0 12px color-mix(in srgb, var(--color-crt) 30%, transparent),
    inset 0 0 8px color-mix(in srgb, var(--color-crt) 15%, transparent);
  transition: box-shadow 0.5s ease-in, border-color 0.3s ease;
}

/* Inset Top Lighting Mask */
.portfolio-arch:after {
  content: "";
  display: block;
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-top-left-radius: 3.40282e38px;
  border-top-right-radius: 3.40282e38px;
  box-shadow: inset 6px 10px 12px rgba(0, 0, 0, 0.80);
}

/* Hover & Selected Ultra-Violet Bloom State */
.portfolio-arch:hover,
.portfolio-arch.selected {
  border-color: var(--color-accentTwo);
  box-shadow: 0 0 80px 30px rgba(210, 93, 255, 0.20);
}
```

---

## 6. The Kinetic Button Architecture (`.btn`)

Tailor’d Design's interactive buttons are unique: they feature double borders, serif typography, and **rotating orbiting circles** that animate on hover:

```css
.btn {
  display: flex;
  position: relative;
  align-items: center;
  height: calc(var(--spacing) * 12); /* 48px */
  padding-inline: calc(var(--spacing) * 3); /* 12px */
  padding-right: 40%;
  border-style: double;
  border-width: 3px;
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  line-height: calc(var(--spacing) * 10);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn:hover {
  border-style: none;
  background-color: var(--color-accent);
  color: var(--color-background);
}

/* The Orbiting Indicator */
.btn .circles {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  transform-origin: 50% 50%;
}

.btn:hover .circles {
  animation: 0.4s linear infinite rotating;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 7. Master Keyframe Animation Library

```css
/* 1. Terminal Cursor & Telemetry Blink */
@keyframes blinking {
  0% { opacity: 0.15; }
  50% { opacity: 1.0; }
  100% { opacity: 0.15; }
}

/* 2. Kinetic Rotating Spinner */
@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 3. Card Viewport Swap */
@keyframes swap {
  0% { transform: translate(0); }
  100% { transform: translate(100%); }
}

/* 4. Button Fill Expansion */
@keyframes button-grow {
  0% { width: 50%; height: 5%; }
  50% { width: 100%; height: 5%; }
  100% { width: 100%; height: 100%; }
}

/* 5. Ambient Beacon Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 8. Screen-by-Screen Component Architecture

### 8.1 Header & Navigation
- **Structure:** Transparent floating bar (`position: sticky; top: 0; z-index: 50;`).
- **Left:** Monochromatic Tailor'd logo mark (`filter: url(#crt-ink)`).
- **Center:** Clean anchor links (`Work`, `Expertise`, `About`, `Contact`) styled in `var(--font-mono)`, lowercase, with hover underline offset:
  ```css
  a:not(.btn):hover {
    text-underline-offset: 3px;
    text-decoration: underline;
    color: var(--color-accent) !important;
  }
  ```
- **Right:** Audio mute toggle / CRT scanlines toggle switch.

### 8.2 Hero Showcase Section
- **Background:** High-resolution photography desaturated with radial vignette (`radial-gradient(ellipse at 70% 0, #6153950c, transparent 45%)`).
- **Typography:** Display title spanning 3 lines with dramatic italic accents:
  ```html
  <h1 class="font-serif text-6xl md:text-8xl text-[#fffddb]">
    High-Performance <br />
    <span class="italic text-[#bb7bfc] crt-glow-lavender">Web Systems</span> &amp; Identity
  </h1>
  ```
- **Terminal Status Pill:** `[ Menifee, CA • Available for Q1/Q2 Builds ]` in 11px uppercase `IBM Plex Mono`.

### 8.3 The Work / Portfolio Showcase (The Roman Arch Carousel)
- **Container Layout:** Horizontal flex track or responsive grid with snap-scrolling.
- **Card Anatomy:** Each project card is framed inside `.portfolio-arch` with:
  1. Image treated with `filter: url(#crt-imageBlue)`.
  2. Hover state activating `filter: url(#crt-imageBlueHover)` and `box-shadow: 0 0 80px 30px rgba(210, 93, 255, 0.20)`.
  3. Overlay metadata: Project name in `var(--font-serif)`, client punchline, and year tags (`2020-2026`) in `var(--font-mono)`.

### 8.4 Services & Capabilities (The 9-Block Module Matrix)
Numbered `01` through `09` with custom ink distortion properties:
1. `01. Full-Stack Web Development` (Frontend architectures, APIs, AI models)
2. `02. Platform Expertise` (Shopify, Salesforce Commerce Cloud, Magento, Next.js)
3. `03. SEO Optimization` (Technical, content architecture, crawl budget)
4. `04. AI Ops` (LLM agents, synthetic data pipelines, chatbots)
5. `05. Graphic Design` (Brand identity, design tokens, marketing assets)
6. `06. Online Customer Support` (Embedded support desks, Zendesk/Intercom)
7. `07. Ecommerce Operations` (Catalog management, conversion funnels)
8. `08. Web3 & Distributed Apps` (Smart contracts, dApps, on-chain minting)
9. `09. Print on Demand` (Fulfillment pipelines, custom storefronts)

### 8.5 The Terminal Contact Console (`#contact`)
- **Container:** `.content-box` with `width: clamp(380px, 30vw, 420px)`.
- **Form Inputs:** Styled with `--color-grayBackground: #232323`, 1px borders in `var(--color-accentThree)`:
  ```css
  input, textarea, select {
    background-color: #232323;
    color: var(--color-primary);
    border: 1px solid rgba(218, 212, 94, 0.40);
    padding: 8px 12px;
    font-family: var(--font-mono);
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 12px rgba(126, 172, 129, 0.35);
  }
  ```
- **Submission Button:** Primary `.btn` with orbiting circles and text *"Request"*.

---

## 9. Replication Protocol for BarrierLens

To replicate this exact design system into BarrierLens while strictly honoring **Apple Human Interface Guidelines (HIG)** and **WCAG 2.2 AAA Accessibility**:

| Tailor'd Design Feature | Raw Agency Execution | BarrierLens Replication Strategy |
| :--- | :--- | :--- |
| **Phosphor Palette** | `#7eac81` (Mint), `#bb7bfc` (Lavender), `#dad45e` (Amber) | Retain exact hex codes for status indicators (Passing, Agent Thinking, Warning). |
| **Typography** | `Instrument Serif` + `IBM Plex Mono` | Exact match: `Instrument Serif` for headings; `IBM Plex Mono` for AST diffs and code. |
| **Roman Arch** | `.portfolio-arch` with infinite radius | Used for the **Live Traversal Aperture Stage** (the browser testing window). |
| **Scanline Overlay** | Global `repeating-linear-gradient` | Encapsulated inside the Live Stage, with instant bypass on `prefers-reduced-motion`. |
| **Hit Targets** | Variable padding | Normalized to Apple's **44×44pt minimum touch target** rule. |
| **Focus Rings** | Subtle glow rings | Augmented with high-contrast dual-ring focus affordances (`focus-visible:ring-2 focus-visible:ring-blue-500`). |

---

## 10. Verification & Browser Compatibility Matrix

1. **Desktop Chrome / Edge / Brave (Chromium 120+):** Full hardware acceleration of SVG filters, arithmetic compositing, and `color-mix(in srgb)`.
2. **Safari (macOS):** Handled via detection script (`.is-safari`); disables CPU-stalling SVG displacement maps while preserving scanlines and text shadows.
3. **Mobile Safari & iOS WebViews:** Retains scanlines and typography; adapts viewport height via `100svh`.
4. **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, all looping keyframes (`blinking`, `rotating`, scanlines) automatically deactivate.
