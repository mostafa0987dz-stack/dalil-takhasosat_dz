import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import Sidebar from "@/components/admin/Sidebar"; // استيراد الشريط الجانبي
import { ExternalLink, LogOut, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();

  return (
    // الخلفية المتدرجة الناعمة التي تعطي تأثير الزجاج
    <div className="min-h-screen bg-[#e8f5f2] dark:bg-[#0f172a]" dir="rtl">
      <div className="flex">
        
        {/* 1. الشريط الجانبي (ثابت في جهة اليمين) */}
        <Sidebar />

        {/* 2. المحتوى الرئيسي (يأخذ باقي المساحة) */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* الشريط العلوي الزجاجي */}
          <header className="sticky top-0 z-40 border-b border-white/40 bg-white/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              
              {/* روابط سريعة */}
              <nav className="flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300">
                <Link href="/admin" className="transition-colors hover:text-teal-600">لوحة التحكم</Link>
                <Link href="/admin/specialties/new" className="transition-colors hover:text-teal-600">تخصص جديد</Link>
                <Link href="/admin/import" className="transition-colors hover:text-teal-600">استيراد</Link>
                <Link href="/" target="_blank" className="flex items-center gap-1 text-slate-500 transition-colors hover:text-teal-600">
                  عرض الموقع <ExternalLink size={14} />
                </Link>
              </nav>

              {/* معلومات المستخدم وزر الخروج */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-white/50 px-3 py-1.5 shadow-sm dark:bg-slate-800/50">
                  <User size={16} className="text-slate-500" />
                  <span dir="ltr" className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
                </div>
                <form action={logoutAction}>
                  <button className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                    <LogOut size={16} />
                    خروج
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* محتوى الصفحة */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
          
        </div>
      </div>
    </div>
  );
}
