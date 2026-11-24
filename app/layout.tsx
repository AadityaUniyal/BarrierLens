import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwissScrollProvider } from '@/components/swiss/SwissScrollProvider';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover'
};

export const metadata: Metadata = {
  title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
  description: 'Prove, verify, and automatically repair digital accessibility barriers before code ships. Autonomous behavioral journey testing, verified source-code repairs, and statutory VPAT 2.5 compliance documentation.',
  keywords: [
    'accessibility',
    'WCAG 2.2',
    'EAA 2025 compliance',
    'ADA Title III',
    'VPAT 2.5',
    'Section 508',
    'automated accessibility audit',
    'verified code remediation'
  ],
  authors: [{ name: 'Aaditya Uniyal', url: 'https://github.com/AadityaUniyal' }],
  metadataBase: new URL('https://barrierlens.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://barrierlens.com',
    siteName: 'BarrierLens',
    title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
    description: 'The web was made for every human. Prove and repair behavioral web barriers with verified source-code fixes and certified compliance reports.',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'BarrierLens — Autonomous Accessibility Verification'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
    description: 'Prove and repair web accessibility barriers before code ships with verified code diffs and statutory compliance reports.',
    images: ['/logo.svg'],
    creator: '@BarrierLens'
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark crt-enabled", "font-sans", geist.variable)}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#7eac81] selection:text-black font-sans">
        {/* Global SVG Shaders & Phosphor Filter Definitions (Tailor'd Design) */}
        <svg width="0" height="0" className="absolute pointer-events-none -z-50 overflow-hidden" aria-hidden="true">
          <defs>
            {/* #crt-ink: Organic Edge Turbulence */}
            <filter id="crt-ink" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 1 0 0" in="grayNoise" result="grainAlpha" />
              <feComposite in="SourceGraphic" in2="grainAlpha" operator="in" result="inked" />
            </filter>

            {/* #crt-image: Monochromatic Phosphor Desaturation */}
            <filter id="crt-image" x="-10%" y="-10%" width="120%" height="120%">
              <feColorMatrix type="saturate" values="0.8" result="colorPass" />
              <feComponentTransfer in="colorPass" result="contrast">
                <feFuncR type="gamma" exponent="0.88" />
                <feFuncG type="gamma" exponent="0.88" />
                <feFuncB type="gamma" exponent="0.88" />
              </feComponentTransfer>
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" result="noise" />
              <feComposite in="contrast" in2="noise" operator="arithmetic" k1="0" k2="1" k3="0.2" k4="-0.1" result="grained" />
              <feComponentTransfer in="grained" result="quantized">
                <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
                <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
                <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              </feComponentTransfer>
              <feComponentTransfer in="quantized" result="phosphor">
                <feFuncR type="table" tableValues="0.08 0.2 0.42 0.65 0.85 0.98" />
                <feFuncG type="table" tableValues="0.08 0.18 0.38 0.62 0.82 0.98" />
                <feFuncB type="table" tableValues="0.1 0.28 0.55 0.8 0.95 1.0" />
              </feComponentTransfer>
              <feComposite in="SourceGraphic" in2="phosphor" operator="arithmetic" k1="0" k2="0.55" k3="0.45" k4="0" result="blended" />
              <feComposite in="blended" in2="SourceAlpha" operator="in" result="masked" />
              <feGaussianBlur in="masked" stdDeviation="1.5" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="0.25" />
              </feComponentTransfer>
              <feBlend in="masked" in2="glow" mode="screen" />
            </filter>

            {/* #crt-imageBlue: Cold Phosphor Cathode Ray Shader */}
            <filter id="crt-imageBlue" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
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

            {/* #crt-imageBlueHover: Saturated Phosphor Bloom Hover */}
            <filter id="crt-imageBlueHover" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
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

        {/*
          ====================================================================
          BARRIERLENS ARCHITECTURAL MANIFESTO · SWISS EDITORIAL SYSTEM
          "Eine Website ist tausend kleine Entscheidungen — treffen jede davon von Hand."
          Aesthetic: Swiss-Minimalist Monochrome · Bricolage Grotesque · Tabular JetBrains
          Deterministic Verification Core: Tarjan Directed Cycle SCC · Kendall Tau Reading Order
          ====================================================================
        */}
        <SwissScrollProvider>
          {children}
        </SwissScrollProvider>
      </body>
    </html>
  );
}
