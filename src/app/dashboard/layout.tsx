"use client";

import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebar();

  return (
    <>
      <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />

      {/* Main content */}
      <div className="pt-14 min-h-screen">
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}
