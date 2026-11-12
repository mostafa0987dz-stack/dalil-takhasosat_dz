import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { deleteSpecialty, togglePublish } from "@/app/admin/actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Search, Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Dashboard() {
  await requireAdmin();
  const sb = adminClient();
  
  const [rowsRes, logsRes] = await Promise.all([
    sb.from("specialties").select("slug,nom_ar,domaine,published,updated_at,thresholds(count)").order("updated_at", { ascending: false }),
    sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(5), // قللنا العدد قليلاً
  ]);
  
  const rows = (rowsRes.data ?? []) as any[];
  const logs = (logsRes.data ?? []) as any[];
  const published = rows.filter((r) => r.published).length;
  const fmt = (d: string) => new Date(d).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-8">
      {/* الترويسة */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">التخصصات</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{rows.length} تخصصاً · {published} منشور · {rows.length - published} مسودة</p>
        </div>
        <Link href="/admin/specialties/new" className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700">
          <Plus size={18} /> إضافة تخصص
        </Link>
      </div>

      {rowsRes.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">تعذّرت قراءة البيانات: {rowsRes.error.message}</p>}

      {/* الجدول الزجاجي */}
      <div className="rounded-3xl border border-white/50 bg-white/60 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-white/20 dark:border-slate-700/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="ابحث عن تخصص..." className="w-full rounded-xl border border-white/20 bg-white/50 py-2 pr-10 pl-4 text-sm outline-none focus:border-teal-500 dark:bg-slate-900/50" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/30 dark:bg-slate-900/30">
              <tr>
                {["التخصص", "المجال", "العتبات", "الحالة", "آخر تعديل", "الإجراءات"].map((h) => (
                  <th key={h} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
              {rows.map((r) => (
                <tr key={r.slug} className="transition-colors hover:bg-white/40 dark:hover:bg-slate-800/40">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-white">{r.nom_ar}</div>
                    <div dir="ltr" className="text-xs text-slate-500 text-right">{r.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{r.domaine}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-100 px-2 py-1 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
                      <FileText size={14} /> {r.thresholds?.[0]?.count ?? 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                      {r.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{fmt(r.updated_at)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/specialties/${r.slug}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-teal-600 shadow-sm transition hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700">تعديل</Link>
                      <form action={togglePublish}>
                        <input type="hidden" name="slug" value={r.slug} />
                        <input type="hidden" name="publish" value={r.published ? "0" : "1"} />
                        <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700">{r.published ? "إلغاء النشر" : "نشر"}</button>
                      </form>
                      <form action={deleteSpecialty}>
                        <input type="hidden" name="slug" value={r.slug} />
                        <ConfirmSubmit message={`حذف التخصص ${r.nom_ar} نهائياً مع عتباته؟`}>
                          <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40">حذف</button>
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !rowsRes.error && (
            <p className="p-8 text-center text-slate-500">لا توجد تخصصات بعد. ابدأ بـ <Link href="/admin/import" className="font-bold text-teal-600">استيراد البيانات</Link>.</p>
          )}
        </div>
      </div>

      {/* سجل العمليات */}
      <section className="rounded-3xl border border-white/50 bg-white/60 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <h2 className="p-6 text-xl font-bold text-slate-800 dark:text-white border-b border-white/20 dark:border-slate-700/50">آخر العمليات</h2>
        <ul className="divide-y divide-white/20 dark:divide-slate-700/50 p-2">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span><b className="text-teal-600">{l.action}</b> <span dir="ltr" className="text-slate-500">{l.slug}</span></span>
              <span className="text-xs text-slate-500"><span dir="ltr">{l.admin_email}</span> · {fmt(l.created_at)}</span>
            </li>
          ))}
          {!logs.length && <li className="px-4 py-3 text-slate-500">لا توجد عمليات مسجلة.</li>}
        </ul>
      </section>
    </div>
  );
}
