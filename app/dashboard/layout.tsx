import React from 'react';
import { DashboardShell } from '@/components/antigravity/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
