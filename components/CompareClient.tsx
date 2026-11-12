"use client";
import { useSearchParams, useRouter } from "next/navigation";
import type { Specialty } from "@/types";
import { minSeuil } from "@/lib/specialty";

const SLOTS = 3;

export default function CompareClient({ items }: { items: Specialty[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const slugs = (sp.get("s") ?? "").split(",").filter((x) => items.some((i) => i.slug === x)).slice(0, SLOTS);
  const chosen = slugs.map((x) => items.find((i) => i.slug === x)!);

  function setSlot(i: number, v: string) {
    const next = [...slugs];
    next[i] = v;
    const clean = next.filter(Boolean);
    router.replace(clean.length ? `/compare?s=${clean.join(",")}` : "/compare", { scroll: false });
  }

  const rows: [string, (s: Specialty) => React.ReactNode][] = [
    ["المجال", (s) => s.domaine],
    ["الشهادة", (s) => s.diplome],
    ["المدة", (s) => s.duree],
    ["الشعب المؤهلة", (s) => s.filiere.join("، ")],
    ["أدنى عتبة معروفة", (s) => { const m = minSeuil(s); return m === null ? "—" : m.toFixed(2); }],
    ["المهارات", (s) => <ul className="list-inside list-disc space-y-1">{s.competences.map((x) => <li key={x}>{x}</li>)}</ul>],
    ["آفاق التوظيف", (s) => <ul className="list-inside list-disc space-y-1">{s.debouches.map((x) => <li key={x}>{x}</li>)}</ul>],
  ];

  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">مقارنة التخصصات</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">اختر حتى ثلاثة تخصصات لمقارنتها. الرابط قابل للمشاركة.</p>
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {Array.from({ length: SLOTS }, (_, i) => (
          <select key={i} className="input" aria-label={`التخصص ${i + 1}`} value={slugs[i] ?? ""} onChange={(e) => setSlot(i, e.target.value)}>
            <option value="">اختر تخصصاً {i + 1}</option>
            {items.map((x) => <option key={x.slug} value={x.slug} disabled={slugs.includes(x.slug) && slugs[i] !== x.slug}>{x.nom_ar}</option>)}
          </select>
        ))}
      </div>
      {chosen.length >= 1 ? (
        <div className="overflow-x-auto rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[32rem] text-right align-top">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr><th scope="col" className="th w-32"> </th>{chosen.map((s) => <th key={s.slug} scope="col" className="th text-base">{s.nom_ar}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(([label, fn]) => (
                <tr key={label} className="border-t dark:border-slate-800">
                  <th scope="row" className="th text-slate-600 dark:text-slate-400">{label}</th>
                  {chosen.map((s) => <td key={s.slug} className="p-4 text-sm leading-7">{fn(s)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="py-12 text-center text-slate-600 dark:text-slate-400">اختر تخصصاً واحداً على الأقل لعرض المقارنة.</p>}
    </section>
  );
}
