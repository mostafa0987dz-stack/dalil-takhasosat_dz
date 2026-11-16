"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Building2, MapPin, Search } from "lucide-react";

export type UniversityCardItem = { id: string; slug: string; name_ar: string; name_fr?: string | null; type: string | null; wilaya: string | null; city: string | null; specialties_count?: number };

/**
 * بطاقات الجامعات مع بحث وتصفية بالولاية والنوع.
 * إن مُرّر specialtySlug فالرابط إلى معدلات هذا التخصص في الجامعة، وإلا إلى صفحة الجامعة.
 */
export default function UniversityCards({ items, specialtySlug, withSearch = true }: { items: UniversityCardItem[]; specialtySlug?: string; withSearch?: boolean }) {
  const [q, setQ] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [type, setType] = useState("");
  const wilayas = useMemo(() => Array.from(new Set(items.map((u) => u.wilaya).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "ar")), [items]);
  const types = useMemo(() => Array.from(new Set(items.map((u) => u.type).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "ar")), [items]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((u) => (!wilaya || u.wilaya === wilaya) && (!type || u.type === type)
      && (!needle || [u.name_ar, u.name_fr, u.wilaya, u.city].some((v) => (v ?? "").toLowerCase().includes(needle))));
  }, [items, q, wilaya, type]);
  const showFilters = items.length > 4;

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {withSearch && (
            <label className="relative min-w-[14rem] flex-1">
              <span className="sr-only">بحث عن جامعة</span>
              <Search size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الجامعة أو المدينة" className="input !pr-11" />
            </label>
          )}
          <label className="text-sm"><span className="sr-only">الولاية</span>
            <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input !w-auto">
              <option value="">كل الولايات</option>{wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          {types.length > 1 && (
            <label className="text-sm"><span className="sr-only">نوع المؤسسة</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input !w-auto">
                <option value="">كل الأنواع</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
      {showFilters && <p className="text-xs text-slate-500" aria-live="polite">{list.length} من {items.length} جامعة</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((u) => (
          <Link key={u.id} href={specialtySlug ? `/specialties/${specialtySlug}/${u.slug}` : `/universities/${u.slug}`} className="card card-hover group flex flex-col">
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Building2 size={20} aria-hidden /></span>
            <h3 className="font-black group-hover:text-blue-600">{u.name_ar}</h3>
            {u.name_fr && <p dir="ltr" className="mt-0.5 text-right text-xs text-slate-500">{u.name_fr}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} aria-hidden />{[u.type, u.wilaya, u.city].filter(Boolean).join(" · ") || "—"}</p>
            <span className="mt-auto flex items-center justify-between pt-4 text-sm font-bold text-blue-600">
              <span>{typeof u.specialties_count === "number" ? `${u.specialties_count} تخصص` : "عرض معدلات القبول"}</span>
              <ArrowLeft size={15} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
      {!list.length && <p className="card text-slate-600 dark:text-slate-400">لا توجد جامعات مطابقة لهذه التصفية.</p>}
    </div>
  );
}
