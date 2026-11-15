"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Specialty } from "@/types";
import { norm } from "@/lib/text";
import SpecialtyCard from "./SpecialtyCard";

export default function SpecialtiesClient({ items }: { items: Specialty[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const d = sp.get("d") ?? "";
  const f = sp.get("f") ?? "";
  const c = sp.get("c") ?? "";

  function setParam(k: string, v: string) {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // مزامنة البحث النصي مع الرابط بعد توقف الكتابة
  useEffect(() => {
    const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q) setParam("q", q); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const domains = useMemo(() => Array.from(new Set(items.map((x) => x.domaine))), [items]);
  const filieres = useMemo(() => Array.from(new Set(items.flatMap((x) => x.filiere))), [items]);
  const diplomas = useMemo(() => Array.from(new Set(items.map((x) => x.diplome))), [items]);

  const filtered = useMemo(() => {
    const n = norm(q);
    return items.filter(
      (x) =>
        (!n || norm(`${x.nom_ar} ${x.nom_fr} ${x.description_ar} ${x.tags.join(" ")}`).includes(n)) &&
        (!d || x.domaine === d) && (!f || x.filiere.includes(f)) && (!c || x.diplome === c),
    );
  }, [items, q, d, f, c]);

  function reset() { setQ(""); router.replace(pathname, { scroll: false }); }

  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">جميع التخصصات</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">ابحث وصفِّ التخصصات حسب المجال والشعبة والشهادة.</p>

      <div className="card mb-4 grid gap-3 md:grid-cols-3">
        <input className="input" aria-label="اسم التخصص" placeholder="اسم التخصص..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="الشعبة" value={f} onChange={(e) => setParam("f", e.target.value)}>
          <option value="">كل الشعب</option>
          {filieres.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="input" aria-label="الشهادة" value={c} onChange={(e) => setParam("c", e.target.value)}>
          <option value="">كل الشهادات</option>
          {diplomas.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="المجال">
        {["", ...domains].map((x) => (
          <button key={x || "all"} onClick={() => setParam("d", x)} aria-pressed={d === x} className={`chip ${d === x ? "chip-active" : ""}`}>{x || "كل المجالات"}</button>
        ))}
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">النتائج: {filtered.length}</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>
      {!filtered.length && (
        <div className="py-16 text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-400">لا توجد نتائج مطابقة.</p>
          <button onClick={reset} className="btn-ghost">مسح الفلاتر</button>
        </div>
      )}
    </section>
  );
}
