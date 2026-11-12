import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e8f5f2] dark:bg-[#0f172a]" dir="rtl">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
