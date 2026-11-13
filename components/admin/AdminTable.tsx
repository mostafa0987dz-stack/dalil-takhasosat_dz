"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Pencil, Search } from "lucide-react";
import { duplicateSpecialty, deleteSpecialty, togglePublish } from "@/app/admin/actions";
import { norm } from "@/lib/text";
import ConfirmSubmit from "./ConfirmSubmit";

export type AdminRow = { slug: string; nom_ar: string; domaine: string; published: boolean; updated_at: string; seuils: number; demo: boolean };
type Sort = "updated" | "name" | "seuils";

export default function AdminTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "pub" | "draft" | "demo">("");
  const [domaine, setDomaine] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const domains = useMemo(() => Array.from(new Set(rows.map((r) => r.domaine))), [rows]);
  const fmt = (d: string) => new Date(d).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short" });

  const list = useMemo(() => {
    const n = norm(q);
    return rows
      .filter((r) => (!n || norm(`${r.nom_ar} ${r.slug}`).includes(n)) && (!domaine || r.domaine === domaine) &&
        (status === "" || (status === "pub" ? r.published : status === "draft" ? !r.published : r.demo)))
      .sort((a, b) => sort === "name" ? a.nom_ar.localeCompare(b.nom_ar, "ar") : sort === "seuils" ? b.seuils - a.seuils : +new Date(b.updated_at) - +new Date(a.updated_at));
  }, [rows, q, status, domaine, sort]);

  return (
    <div>
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input className="input !pr-10" aria-label="بحث" placeholder="بحث بالاسم أو المعرّف" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" aria-label="الحالة" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="">كل الحالات</option><option value="pub">منشور</option><option value="draft">مسودة</option><option value="demo">عتبات تجريبية</option>
        </select>
        <select className="input" aria-label="المجال" value={domaine} onChange={(e) => setDomaine(e.target.value)}>
          <option value="">كل المجالات</option>{domains.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="input" aria-label="الترتيب" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="updated">الأحدث تعديلاً</option><option value="name">الاسم</option><option value="seuils">عدد العتبات</option>
        </select>
      </div>

      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">المعروض: {list.length} من {rows.length}</p>
      <div className="table-wrap">
        <table className="w-full min-w-[46rem] text-right">
          <thead className="bg-white/50 dark:bg-slate-800/40"><tr>{["التخصص", "المجال", "العتبات", "الحالة", "آخر تعديل", ""].map((h, i) => <th key={i} scope="col" className="th">{h}</th>)}</tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.slug} className="border-t border-slate-200/60 dark:border-slate-700/60">
                <td className="p-4 font-bold">{r.nom_ar}<div dir="ltr" className="text-right text-xs font-normal text-slate-500">{r.slug}</div></td>
                <td className="p-4 text-sm">{r.domaine}</td>
                <td className="p-4 text-sm">{r.seuils}{r.demo && <span className="mr-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">تجريبي</span>}</td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${r.published ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{r.published ? "منشور" : "مسودة"}</span></td>
                <td className="p-4 text-xs text-slate-500">{fmt(r.updated_at)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/specialties/${r.slug}`} className="btn-ghost !py-1.5"><Pencil size={14} />تعديل</Link>
                    {r.published && <Link href={`/specialties/${r.slug}`} target="_blank" className="btn-ghost !py-1.5"><ExternalLink size={14} />عرض</Link>}
                    <form action={duplicateSpecialty}><input type="hidden" name="slug" value={r.slug} /><button className="btn-ghost !py-1.5"><Copy size={14} />نسخ</button></form>
                    <form action={togglePublish}>
                      <input type="hidden" name="slug" value={r.slug} /><input type="hidden" name="publish" value={r.published ? "0" : "1"} />
                      <button className="btn-ghost !py-1.5">{r.published ? "إلغاء النشر" : "نشر"}</button>
                    </form>
                    <form action={deleteSpecialty}><input type="hidden" name="slug" value={r.slug} /><ConfirmSubmit message={`حذف التخصص ${r.nom_ar} نهائياً مع عتباته؟`}>حذف</ConfirmSubmit></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="p-8 text-center text-slate-600 dark:text-slate-400">لا توجد نتائج مطابقة.</p>}
      </div>
    </div>
  );
}
