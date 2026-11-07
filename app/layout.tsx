import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover'
};

export const metadata: Metadata = {
  title: 'BarrierLens 2.0 — Autonomous Agentic Accessibility Verification',
  description: 'Prove and repair web accessibility barriers before code ships. Combines deterministic Tarjan SCC focus graphs, acoustic screen reader simulation, and autonomous multi-agent reasoning swarms.',
  keywords: [
    'accessibility',
    'WCAG 2.2',
    'EAA compliance',
    'agentic AI',
    'autonomous reasoning mesh',
    'Tarjan SCC',
    'keyboard trap proof',
    'screen reader acoustic simulation',
    'autonomous web audit'
  ],
  authors: [{ name: 'Aaditya Uniyal', url: 'https://github.com/AadityaUniyal' }],
  metadataBase: new URL('https://barrierlens.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://barrierlens.com',
    siteName: 'BarrierLens',
    title: 'BarrierLens 2.0 — Autonomous Agentic Accessibility Verification',
    description: 'The web was made for every human. Prove and repair behavioral web barriers with mathematical certainty.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BarrierLens 2.0 — Autonomous Agentic Accessibility Verification'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarrierLens 2.0 — Autonomous Agentic Accessibility Verification',
    description: 'Prove and repair web accessibility barriers before code ships with deterministic proofs and verified AST repairs.',
    images: ['/og-image.png'],
    creator: '@BarrierLens'
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-[#f5f5f7] antialiased selection:bg-[#0071e3] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
