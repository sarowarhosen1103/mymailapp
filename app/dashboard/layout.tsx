import { ReactNode } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-slate-900 flex text-white overflow-hidden font-sans">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <DashboardSidebar />
      </div>

      <div className="flex flex-1 flex-col lg:pl-72">
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-10 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
