import Link from "next/link";
import { LayoutDashboard, PlusCircle, FileUp, Globe2, LogOut, ShieldCheck, Megaphone, Settings, GraduationCap } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const nav = [
    { href: "/admin", label: "نظرة عامة", Icon: LayoutDashboard },
    { href: "/admin/specialties/new", label: "إضافة تخصص", Icon: PlusCircle },
    { href: "/admin/import", label: "استيراد البيانات", Icon: FileUp },
    { href: "/admin/series", label: "إدارة الشعب", Icon: GraduationCap },
    { href: "/admin/ads", label: "إدارة الإعلانات", Icon: Megaphone },
    { href: "/admin/settings", label: "الإعدادات", Icon: Settings },
  ];
  return <div className="admin-shell min-h-screen">
    <aside className="admin-sidebar">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20"><ShieldCheck size={23}/></span>
        <span><b className="block text-base font-black">دليل التخصصات</b><small className="text-slate-500">مركز الإدارة</small></span>
      </Link>
      <div className="mx-4 mb-3 mt-4 text-[11px] font-black tracking-widest text-slate-400">القائمة الرئيسية</div>
      <nav className="space-y-1 px-3">{nav.map(({href,label,Icon}) => <Link key={href} href={href} className="admin-nav-link"><Icon size={18}/><span>{label}</span></Link>)}</nav>
      <div className="mt-auto border-t border-slate-200/70 p-4 dark:border-slate-800">
        <div className="mb-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900"><div className="text-xs font-bold">الحساب النشط</div><div dir="ltr" className="mt-1 truncate text-xs text-slate-500">{email}</div></div>
        <Link href="/" target="_blank" className="admin-nav-link"><Globe2 size={18}/>عرض الموقع</Link>
        <form action={logoutAction}><button className="admin-nav-link w-full text-red-600"><LogOut size={18}/>تسجيل الخروج</button></form>
      </div>
    </aside>
    <main className="admin-main"><div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"><span className="font-semibold">مساحة إدارة المحتوى</span><span className="text-xs opacity-70">الجزائر · {new Date().getFullYear()}</span></div>{children}</main>
  </div>;
}
