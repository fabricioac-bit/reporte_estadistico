import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      <Sidebar />
      <main className="flex-1 min-h-0 h-screen overflow-y-auto">
        <Header />
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
