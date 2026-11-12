import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  return (
    <>
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <nav className="flex items-center gap-5 text-sm font-bold">
            <Link href="/admin" className="text-blue-700 dark:text-blue-400">لوحة التحكم</Link>
            <Link href="/admin/specialties/new">تخصص جديد</Link>
            <Link href="/admin/import">استيراد</Link>
            <Link href="/" target="_blank" className="text-slate-500">عرض الموقع ↗</Link>
          </nav>
          <form action={logoutAction} className="flex items-center gap-3 text-sm">
            <span dir="ltr" className="text-slate-500">{email}</span>
            <button className="btn-ghost">خروج</button>
          </form>
        </div>
      </header>
      <div className="container-page py-8">{children}</div>
    </>
  );
}
