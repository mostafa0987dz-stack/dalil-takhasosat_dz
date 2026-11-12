import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { deleteSpecialty, togglePublish } from "@/app/admin/actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Dashboard() {
  await requireAdmin();
  const sb = adminClient();
  const [rowsRes, logsRes] = await Promise.all([
    sb.from("specialties").select("slug,nom_ar,domaine,published,updated_at,thresholds(count)").order("updated_at", { ascending: false }),
    sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(10),
  ]);
  const rows = (rowsRes.data ?? []) as any[];
  const logs = (logsRes.data ?? []) as any[];
  const published = rows.filter((r) => r.published).length;
  const fmt = (d: string) => new Date(d).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">التخصصات</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{rows.length} تخصصاً · {published} منشور · {rows.length - published} مسودة</p>
        </div>
        <Link href="/admin/specialties/new" className="btn-primary">+ تخصص جديد</Link>
      </div>
      {rowsRes.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">تعذّرت قراءة البيانات: {rowsRes.error.message}. تأكد من تنفيذ supabase/schema.sql.</p>}

      <div className="overflow-x-auto rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-right">
          <thead className="bg-slate-100 dark:bg-slate-800"><tr>{["التخصص", "المجال", "العتبات", "الحالة", "آخر تعديل", ""].map((h) => <th key={h} scope="col" className="th">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-t dark:border-slate-800">
                <td className="p-4 font-bold">{r.nom_ar}<div dir="ltr" className="text-right text-xs font-normal text-slate-500">{r.slug}</div></td>
                <td className="p-4 text-sm">{r.domaine}</td>
                <td className="p-4 text-sm">{r.thresholds?.[0]?.count ?? 0}</td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${r.published ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{r.published ? "منشور" : "مسودة"}</span></td>
                <td className="p-4 text-xs text-slate-500">{fmt(r.updated_at)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/specialties/${r.slug}`} className="btn-ghost !py-1.5">تعديل</Link>
                    <form action={togglePublish}>
                      <input type="hidden" name="slug" value={r.slug} />
                      <input type="hidden" name="publish" value={r.published ? "0" : "1"} />
                      <button className="btn-ghost !py-1.5">{r.published ? "إلغاء النشر" : "نشر"}</button>
                    </form>
                    <form action={deleteSpecialty}>
                      <input type="hidden" name="slug" value={r.slug} />
                      <ConfirmSubmit message={`حذف التخصص ${r.nom_ar} نهائياً مع عتباته؟`}>حذف</ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !rowsRes.error && <p className="p-8 text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات بعد. ابدأ بـ <Link href="/admin/import" className="font-bold text-blue-600">استيراد data/specialties.json</Link>.</p>}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-black">آخر العمليات</h2>
        <ul className="card divide-y divide-slate-100 p-0 text-sm dark:divide-slate-800">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <span><b>{l.action}</b> {l.slug && <span dir="ltr" className="text-slate-500">{l.slug}</span>}</span>
              <span className="text-slate-500"><span dir="ltr">{l.admin_email}</span> · {fmt(l.created_at)}</span>
            </li>
          ))}
          {!logs.length && <li className="px-4 py-3 text-slate-500">لا توجد عمليات مسجلة.</li>}
        </ul>
      </section>
    </div>
  );
}
