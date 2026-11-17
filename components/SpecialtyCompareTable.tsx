import Link from "next/link";

export type CompareCol = { slug: string; nom_ar: string; duree: string; diplome: string; filiere: string[]; min: { score: number; year: number } | null };

/** جدول مقارنة سريع: التخصص الحالي (العمود الأول بعد التسميات) مقابل أقرب التخصصات المشابهة. */
export default function SpecialtyCompareTable({ cols }: { cols: CompareCol[] }) {
  if (cols.length < 2) return null;
  const rows: { label: string; value: (c: CompareCol) => string }[] = [
    { label: "المدة", value: (c) => c.duree || "—" },
    { label: "الشهادة", value: (c) => c.diplome || "—" },
    { label: "أدنى معدل (آخر سنة)", value: (c) => (c.min ? `${c.min.score.toFixed(2)} (${c.min.year})` : "—") },
    { label: "الشعب المؤهلة", value: (c) => (c.filiere.length ? c.filiere.join("، ") : "—") },
  ];
  const cell = (i: number) => (i === 0 ? "bg-blue-50/70 font-bold dark:bg-blue-950/30" : "");
  return (
    <section aria-labelledby="quick-compare">
      <h3 id="quick-compare" className="mb-3 text-xl font-black">مقارنة سريعة مع المشابهة</h3>
      <div className="table-wrap">
        <table className="w-full min-w-[34rem] text-right text-sm">
          <thead>
            <tr className="bg-white/50 dark:bg-slate-800/40">
              <th scope="col" className="th sticky right-0 z-10 bg-white/95 dark:bg-slate-900/95"><span className="sr-only">المعيار</span></th>
              {cols.map((c, i) => (
                <th key={c.slug} scope="col" className={`th ${cell(i)}`}><Link prefetch={false} href={`/specialties/${c.slug}`} className="text-blue-700 hover:underline dark:text-blue-300">{c.nom_ar}</Link></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-slate-200/60 dark:border-slate-700/60">
                <th scope="row" className="sticky right-0 z-10 bg-white/95 p-3 font-bold dark:bg-slate-900/95">{r.label}</th>
                {cols.map((c, i) => <td key={c.slug} className={`p-3 align-top ${cell(i)}`}>{r.value(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3"><Link prefetch={false} href={`/compare?s=${cols.slice(0, 3).map((c) => c.slug).join(",")}`} className="font-bold text-blue-600">قارن بالتفصيل →</Link></p>
    </section>
  );
}
