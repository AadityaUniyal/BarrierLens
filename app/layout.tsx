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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#0071e3] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
