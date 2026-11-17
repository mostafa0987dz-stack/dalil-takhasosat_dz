import Link from "next/link";
import { Globe2, LogOut, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  return <div className="admin-shell min-h-screen">
    <aside className="admin-sidebar">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20"><ShieldCheck size={23}/></span>
        <span><b className="block text-base font-black">دليل التخصصات</b><small className="text-slate-500">مركز الإدارة</small></span>
      </Link>
      <AdminNav />
      <div className="mt-auto border-t border-slate-200/70 p-4 dark:border-slate-800">
        <div className="mb-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900"><div className="text-xs font-bold">الحساب النشط</div><div dir="ltr" className="mt-1 truncate text-xs text-slate-500">{email}</div></div>
        <Link href="/" target="_blank" className="admin-nav-link"><Globe2 size={18}/>عرض الموقع</Link>
        <form action={logoutAction}><button className="admin-nav-link w-full text-red-600"><LogOut size={18}/>تسجيل الخروج</button></form>
      </div>
    </aside>
    <main className="admin-main"><div className="mx-auto w-full max-w-6xl">{children}</div></main>
  </div>;
}
