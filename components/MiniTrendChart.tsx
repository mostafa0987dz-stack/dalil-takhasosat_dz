"use client";
import { useState } from "react";
import Sparkline from "./Sparkline";

type Point = { year: number; score: number };

/** تطور أدنى معدل قبول (عبر كل الجامعات) لشعبة مختارة؛ يستعمل Sparkline بلا أي مكتبة رسوم. */
export default function MiniTrendChart({ byBranch, defaultBranch }: { byBranch: Record<string, Point[]>; defaultBranch: string }) {
  const branches = Object.keys(byBranch);
  const [branch, setBranch] = useState(branches.includes(defaultBranch) ? defaultBranch : branches[0]);
  const points = byBranch[branch] ?? [];
  if (!branches.length) return null;
  return (
    <section className="card mb-6" aria-labelledby="trend-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 id="trend-title" className="text-lg font-black">تطور أدنى معدل قبول</h3>
        <label className="text-sm">
          <span className="sr-only">الشعبة</span>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input !w-auto">
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
      </div>
      {points.length >= 2 ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="max-w-full overflow-x-auto"><Sparkline points={points} width={260} height={64} label={`تطور أدنى معدل قبول لشعبة ${branch}`} /></div>
          <ul className="flex flex-wrap gap-2 text-sm">
            {points.map((p) => <li key={p.year} className="rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800"><span className="text-slate-500">{p.year}</span> <b>{p.score.toFixed(2)}</b></li>)}
          </ul>
        </div>
      ) : <p className="text-sm text-slate-500">لا تتوفر سنوات كافية لرسم تطور هذه الشعبة.</p>}
      <p className="mt-3 text-xs text-slate-500">المصدر: آخر {points.length} سنوات، قد تتغير المعدلات سنوياً.</p>
    </section>
  );
}
