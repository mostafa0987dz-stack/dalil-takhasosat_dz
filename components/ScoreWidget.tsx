"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { admissionStatus } from "@/lib/rates";

export type ScoreItem = { key: string; label: string; href: string; rates: { b: string; y: number; s: number }[] }; // أحدث معدل لكل شعبة

const COPY = {
  specialty: { title: "هل معدلي يكفي لهذا التخصص؟", unit: "جامعة", hint: "اختر شعبتك وأدخل معدلك لنعدّ الجامعات التي يكفيك فيها معدلك لهذا التخصص." },
  university: { title: "هل معدلي يكفي لأي تخصص في هذه الجامعة؟", unit: "تخصصاً", hint: "اختر شعبتك وأدخل معدلك لنعدّ التخصصات التي يكفيك فيها معدلك في هذه الجامعة." },
} as const;

/** أداة مطوية افتراضياً (بلا تخزين محلي): تعدّ العناصر (جامعات أو تخصصات) التي يكفيها معدل الطالب حسب آخر معدل مسجّل لشعبته. */
export default function ScoreWidget({ scope, items, branches }: { scope: "specialty" | "university"; items: ScoreItem[]; branches: string[] }) {
  const copy = COPY[scope];
  const [branch, setBranch] = useState("");
  const [avg, setAvg] = useState("");
  const average = Number(avg.replace(",", "."));
  const ready = Boolean(branch) && avg.trim() !== "" && Number.isFinite(average) && average >= 0 && average <= 20;

  const result = useMemo(() => {
    if (!ready) return null;
    const withRate = items.flatMap((it) => { const r = it.rates.find((x) => x.b === branch); return r ? [{ it, r }] : []; });
    const ok = withRate.filter(({ r }) => admissionStatus(r.s, average) === "ok").sort((a, b) => b.r.s - a.r.s);
    const near = withRate.filter(({ r }) => admissionStatus(r.s, average) === "near").length;
    return { total: withRate.length, ok, near };
  }, [ready, items, branch, average]);

  if (!items.length || !branches.length) return null;
  return (
    <details className="card mb-6 group">
      <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-3 font-black">
        <span>🎯 {copy.title}</span><span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span>
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">{copy.hint}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <label className="text-sm font-bold">شعبتك
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input mt-1">
              <option value="">اختر الشعبة</option>{branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">معدلك
            <input value={avg} onChange={(e) => setAvg(e.target.value)} inputMode="decimal" placeholder="مثال: 14.5" className="input mt-1" />
          </label>
        </div>
        {result && (
          <div role="status" aria-live="polite" className="space-y-3">
            <p className="rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
              {result.total
                ? <>معدلك {average.toFixed(2)} في شعبة «{branch}» يكفي لـ <b>{result.ok.length}</b> {copy.unit} من {result.total} لها معدل مسجّل لشعبتك{result.near ? `، و${result.near} أخرى قريبة (ينقصك نقطة أو أقل)` : ""}. المعدلات تتغير كل سنة، فاعتبرها مؤشراً لا ضماناً.</>
                : <>لا تتوفر معدلات مسجّلة لشعبة «{branch}» هنا بعد.</>}
            </p>
            {result.ok.length > 0 && (
              <ul className="flex flex-wrap gap-2 text-sm">
                {result.ok.slice(0, 5).map(({ it, r }) => (
                  <li key={it.key}><Link prefetch={false} href={it.href} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">{it.label}<span className="text-xs opacity-70">{r.s.toFixed(2)} ({r.y})</span></Link></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
