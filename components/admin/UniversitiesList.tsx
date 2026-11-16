"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type UniversityRowView = { id: string; slug: string; name_ar: string; type: string | null; wilaya: string | null; city: string | null; is_published: boolean; specialties: number; rates: number };

export default function UniversitiesList({ rows }: { rows: UniversityRowView[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pub" | "draft">("all");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (status === "all" || (status === "pub") === r.is_published)
      && (!needle || [r.name_ar, r.slug, r.wilaya, r.city].some((v) => (v ?? "").toLowerCase().includes(needle))));
  }, [rows, q, status]);

  return (
    <section className="space-y-3" aria-label="الجامعات المسجلة">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">بحث في الجامعات</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الولاية أو المعرّف" className="input !pr-11" />
        </label>
        <div className="flex gap-2" role="group" aria-label="تصفية الحالة">
          {([["all", "الكل"], ["pub", "منشورة"], ["draft", "مسودات"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setStatus(v)} aria-pressed={status === v} className={`chip ${status === v ? "chip-active" : ""}`}>{l}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500" aria-live="polite">{list.length} من {rows.length}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((u) => (
          <Link key={u.id} href={`/admin/universities/${u.id}`} className="card card-hover flex items-start justify-between gap-3">
            <span className="min-w-0">
              <b className="block truncate">{u.name_ar}</b>
              <span className="mt-1 block text-xs text-slate-500">{[u.type, u.wilaya, u.city].filter(Boolean).join(" · ") || "—"}</span>
              <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{u.specialties} تخصص</span><span className="rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{u.rates} سجل معدل</span></span>
            </span>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${u.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{u.is_published ? "منشورة" : "مسودة"}</span>
          </Link>
        ))}
      </div>
      {!list.length && <p className="card text-sm text-slate-500">لا توجد نتائج مطابقة.</p>}
    </section>
  );
}
