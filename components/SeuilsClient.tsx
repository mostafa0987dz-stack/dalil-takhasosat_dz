"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { norm } from "@/lib/text";
import DemoNotice from "./DemoNotice";

type Row = { name: string; slug: string; serie: string; annee: number; score: number | null; note: string; demo: boolean };
type SortKey = "name" | "serie" | "annee" | "score";

export default function SeuilsClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [key, setKey] = useState<SortKey>("score");
  const [dir, setDir] = useState<1 | -1>(-1);

  const filtered = useMemo(() => {
    const n = norm(q);
    const list = rows.filter((x) => !n || norm(`${x.name} ${x.serie}`).includes(n));
    return list.sort((a, b) => {
      // القيم الفارغة تذهب دائماً إلى النهاية
      if (key === "score") {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return (a.score - b.score) * dir;
      }
      if (key === "annee") return (a.annee - b.annee) * dir;
      return a[key].localeCompare(b[key], "ar") * dir;
    });
  }, [rows, q, key, dir]);

  function sortBy(k: SortKey) {
    if (k === key) setDir(dir === 1 ? -1 : 1); else { setKey(k); setDir(k === "score" || k === "annee" ? -1 : 1); }
  }
  const heads: [SortKey, string][] = [["name", "التخصص"], ["serie", "الشعبة"], ["annee", "السنة"], ["score", "العتبة"]];

  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">عتبات القبول</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">جدول قابل للبحث والترتيب. اضغط على عنوان العمود للترتيب.</p>
      {rows.some((r) => r.demo) && <DemoNotice />}
      <input className="input mb-5" aria-label="بحث" placeholder="ابحث عن تخصص أو شعبة" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-right">
          <thead className="bg-slate-100 dark:bg-slate-800">
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
              <tr key={`${x.slug}-${x.serie}-${x.annee}`} className="border-t dark:border-slate-800">
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
