"use client";

import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebar();

  return (
    <>
      <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />

      {/* Main content — offset for fixed sidebar on desktop */}
      <div className="pt-14 min-h-screen lg:pl-64">
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
