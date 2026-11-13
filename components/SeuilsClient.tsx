"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, RotateCcw } from "lucide-react";
import { norm } from "@/lib/text";
import DemoNotice from "./DemoNotice";

type Row = { name: string; slug: string; domaine: string; serie: string; annee: number; score: number | null; note: string; demo: boolean };
type SortKey = "name" | "serie" | "annee" | "score";

export default function SeuilsClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [serie, setSerie] = useState("");
  const [year, setYear] = useState("");
  const [domaine, setDomaine] = useState("");
  const [mine, setMine] = useState("");
  const [key, setKey] = useState<SortKey>("score");
  const [dir, setDir] = useState<1 | -1>(-1);

  const series = useMemo(() => Array.from(new Set(rows.map((r) => r.serie))), [rows]);
  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.annee))).sort((a, b) => b - a), [rows]);
  const domains = useMemo(() => Array.from(new Set(rows.map((r) => r.domaine))), [rows]);
  const myAvg = mine.trim() === "" ? null : Number(mine.replace(",", "."));
  const hasAvg = myAvg !== null && Number.isFinite(myAvg);

  const filtered = useMemo(() => {
    const n = norm(q);
    const list = rows.filter(
      (x) =>
        (!n || norm(`${x.name} ${x.serie}`).includes(n)) &&
        (!serie || x.serie === serie) && (!year || x.annee === Number(year)) && (!domaine || x.domaine === domaine) &&
        (!hasAvg || (x.score !== null && x.score <= myAvg!)),
    );
    return list.sort((a, b) => {
      if (key === "score") {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return (a.score - b.score) * dir;
      }
      if (key === "annee") return (a.annee - b.annee) * dir;
      return a[key].localeCompare(b[key], "ar") * dir;
    });
  }, [rows, q, serie, year, domaine, hasAvg, myAvg, key, dir]);

  function sortBy(k: SortKey) {
    if (k === key) setDir(dir === 1 ? -1 : 1); else { setKey(k); setDir(k === "score" || k === "annee" ? -1 : 1); }
  }
  function reset() { setQ(""); setSerie(""); setYear(""); setDomaine(""); setMine(""); }
  const heads: [SortKey, string][] = [["name", "التخصص"], ["serie", "الشعبة"], ["annee", "السنة"], ["score", "العتبة"]];
  const dirty = q || serie || year || domaine || mine;

  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">عتبات القبول</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">ابحث وفلتر حسب الشعبة والسنة والمجال، أو أدخل معدلك لعرض ما يناسبه فقط. اضغط على عنوان العمود للترتيب.</p>
      {rows.some((r) => r.demo) && <DemoNotice />}

      <div className="card mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" aria-label="بحث" placeholder="ابحث عن تخصص أو شعبة" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="الشعبة" value={serie} onChange={(e) => setSerie(e.target.value)}>
          <option value="">كل الشعب</option>{series.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className="input" aria-label="السنة" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">كل السنوات</option>{years.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className="input" aria-label="المجال" value={domaine} onChange={(e) => setDomaine(e.target.value)}>
          <option value="">كل المجالات</option>{domains.map((x) => <option key={x}>{x}</option>)}
        </select>
        <input className="input" type="number" inputMode="decimal" min={0} max={20} step={0.01} aria-label="معدلي" placeholder="معدلي (اختياري)" value={mine} onChange={(e) => setMine(e.target.value)} />
        {dirty && <button onClick={reset} className="btn-ghost justify-center"><RotateCcw size={14} />مسح الفلاتر</button>}
      </div>

      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">النتائج: {filtered.length}{hasAvg ? ` (عتبات ≤ ${myAvg!.toFixed(2)})` : ""}</p>
      <div className="table-wrap">
        <table className="w-full min-w-[34rem] text-right">
          <thead className="bg-white/50 dark:bg-slate-800/40">
            <tr>
              {heads.map(([k, l]) => (
                <th key={k} scope="col" className="th" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
                  <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-blue-600">{l}<ArrowDownUp size={14} aria-hidden /></button>
                </th>
              ))}
              <th scope="col" className="th">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr key={`${x.slug}-${x.serie}-${x.annee}`} className="border-t border-slate-200/60 dark:border-slate-700/60">
                <td className="p-4 font-bold"><Link href={`/specialties/${x.slug}`} className="hover:text-blue-600">{x.name}</Link></td>
                <td className="p-4">{x.serie}</td>
                <td className="p-4">{x.annee}</td>
                <td className="p-4 font-bold">{x.score !== null ? x.score.toFixed(2) : "—"}</td>
                <td className="p-4 text-xs text-amber-800 dark:text-amber-400">{x.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="p-8 text-center text-slate-600 dark:text-slate-400">لا توجد نتائج.</p>}
      </div>
    </section>
  );
}
