import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Geist, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { LenisProvider } from '@/components/ui/LenisProvider';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const viewport: Viewport = {
  themeColor: '#07080b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
  description:
    'Prove what locks them out. Fix it before you ship. Autonomous behavioral journey testing, mathematical trap proofs, differential replay verification, and VPAT 2.5 compliance.',
  keywords: [
    'accessibility',
    'WCAG 2.2',
    'EAA 2025 compliance',
    'ADA Title III',
    'VPAT 2.5',
    'automated accessibility audit',
    'Tarjan SCC',
    'verified code remediation',
  ],
  authors: [{ name: 'Aaditya Uniyal', url: 'https://github.com/AadityaUniyal' }],
  metadataBase: new URL('https://barrierlens.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://barrierlens.com',
    siteName: 'BarrierLens',
    title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
    description:
      'Prove what locks them out. Fix it before you ship. Mathematical barrier proofs and verified source-code patches.',
    images: [{ url: '/logo.svg', width: 1200, height: 630, alt: 'BarrierLens' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarrierLens — Autonomous Accessibility Verification & Code Remediation',
    description:
      'Prove and repair web accessibility barriers before code ships with verified code diffs and VPAT 2.5 reports.',
    images: ['/logo.svg'],
    creator: '@BarrierLens',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn('dark font-sans', geist.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen ag-atmosphere text-[#f8fafc] antialiased selection:bg-[#0090ff] selection:text-white font-sans">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
