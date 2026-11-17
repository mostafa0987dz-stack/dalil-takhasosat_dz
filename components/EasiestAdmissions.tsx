"use client";
import Link from "next/link";
import { useState } from "react";
import type { UniSpecialtyView } from "./UniversitySpecialties";

/** أسهل 5 تخصصات قبولاً (أدنى آخر معدل) في الجامعة لشعبة مختارة. */
export default function EasiestAdmissions({ universitySlug, wilaya, items, branches }: { universitySlug: string; wilaya: string | null; items: UniSpecialtyView[]; branches: string[] }) {
  const [branch, setBranch] = useState(branches.includes("علوم تجريبية") ? "علوم تجريبية" : branches[0] ?? "");
  if (!branches.length) return null;
  const top = items
    .flatMap((i) => { const r = i.rates.find((x) => x.b === branch); return r ? [{ i, r }] : []; })
    .sort((a, b) => a.r.s - b.r.s || a.i.nom_ar.localeCompare(b.i.nom_ar, "ar"))
    .slice(0, 5);
  const finder = `/finder?b=${encodeURIComponent(branch)}${wilaya ? `&w=${encodeURIComponent(wilaya)}` : ""}`;
  return (
    <section className="card mb-6" aria-labelledby="easiest-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="easiest-title" className="text-lg font-black">🎯 أسهل القبول في هذه الجامعة</h2>
        <label className="text-sm"><span className="sr-only">الشعبة</span>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input !w-auto">{branches.map((b) => <option key={b} value={b}>{b}</option>)}</select>
        </label>
      </div>
      {top.length ? (
        <ol className="space-y-2 text-sm">
          {top.map(({ i, r }, idx) => (
            <li key={i.slug}>
              <Link prefetch={false} href={`/specialties/${i.slug}/${universitySlug}`} className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                <span className="font-bold"><span className="text-slate-400">{idx + 1}.</span> {i.nom_ar}</span>
                <span className="text-slate-600 dark:text-slate-300"><b>{r.s.toFixed(2)}</b> · {r.y}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-slate-500">لا تتوفر معدلات لهذه الشعبة.</p>}
      <p className="mt-3 text-sm"><Link prefetch={false} href={finder} className="font-bold text-blue-600">عرض الكل ←</Link></p>
    </section>
  );
}
