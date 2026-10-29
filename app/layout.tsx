import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarrierLens | Agentic Accessibility Auditor & Autonomous Remediation',
  description: 'Top 0.1% Task-Conditioned Agentic Accessibility Auditor built on Neon Postgres & Playwright CDP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090a0f] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
