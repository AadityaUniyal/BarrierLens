import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarrierLens | Free task-conditioned accessibility auditor',
  description: 'Paste a public URL and a real user task. BarrierLens walks the page as a keyboard user and proves accessibility barriers you can share.',
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
