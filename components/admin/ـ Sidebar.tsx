"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, PlusCircle, Settings, LogOut, Megaphone } from "lucide-react";

const menuItems = [
  { name: "الرئيسية", icon: LayoutDashboard, href: "/admin" },
  { name: "التخصصات", icon: List, href: "/admin/specialties" },
  { name: "إضافة تخصص", icon: PlusCircle, href: "/admin/specialties/new" },
  { name: "إدارة الإعلانات", icon: Megaphone, href: "/admin/ads" },
  { name: "الإعدادات", icon: Settings, href: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-l border-white/40 bg-white/40 backdrop-blur-xl dark:bg-slate-900/40 h-screen sticky top-0 flex flex-col p-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-xl shadow-lg shadow-teal-600/30">
          D
        </div>
        <span className="text-xl font-black text-slate-800 dark:text-white">دليل التخصصات</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                  : "text-slate-600 hover:bg-white/60 hover:text-teal-600 dark:text-slate-400 dark:hover:bg-slate-800/50"
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/20">
        <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
