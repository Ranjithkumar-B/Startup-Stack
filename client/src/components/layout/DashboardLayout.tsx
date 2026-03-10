import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
