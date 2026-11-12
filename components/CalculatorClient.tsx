"use client";
import { useMemo, useState } from "react";
import type { Specialty } from "@/types";
import { SERIE_NAMES } from "@/lib/constants";
import { seuilFor, hasDemo } from "@/lib/specialty";
import DemoNotice from "./DemoNotice";

const FIELDS = [["general", "المعدل العام"], ["math", "الرياضيات"], ["science", "العلوم الطبيعية"], ["physics", "الفيزياء"]] as const;
type Key = (typeof FIELDS)[number][0];
type Status = "ok" | "near" | "below" | "none";

const STATUS: Record<Status, { label: string; cls: string; bar: string }> = {
  ok: { label: "مناسب", cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", bar: "bg-emerald-500" },
  near: { label: "قريب من العتبة", cls: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300", bar: "bg-amber-500" },
  below: { label: "أقل من العتبة", cls: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300", bar: "bg-red-500" },
  none: { label: "—", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", bar: "bg-slate-400" },
};
const NEAR_MARGIN = 1.5;

export default function CalculatorClient({ items, initialSpecialty }: { items: Specialty[]; initialSpecialty: string }) {
  const [serie, setSerie] = useState(SERIE_NAMES[0]);
  const [marks, setMarks] = useState<Record<Key, string>>({ general: "", math: "", science: "", physics: "" });
  const [chosen, setChosen] = useState(items.some((x) => x.slug === initialSpecialty) ? initialSpecialty : "");

  const calc = useMemo(() => {
    const bad: Key[] = [];
    const ok: Partial<Record<Key, number>> = {};
    for (const [k] of FIELDS) {
      const raw = marks[k].trim().replace(",", ".");
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 20) bad.push(k); else ok[k] = n;
    }
    const subs = (["math", "science", "physics"] as const).map((k) => ok[k]).filter((v): v is number => v !== undefined);
    const avg = subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : null;
    const useGeneral = ok.general !== undefined;
    return { bad, score: ok.general ?? avg, useGeneral };
  }, [marks]);

  const rows = useMemo(() => {
    return items
      .filter((s) => (chosen ? s.slug === chosen : s.filiere.includes(serie)))
      .map((s) => {
        const t = seuilFor(s, serie);
        const m = t?.moyenne ?? null;
        let status: Status = "none";
        if (m !== null && calc.score !== null && calc.bad.length === 0) status = calc.score >= m ? "ok" : calc.score >= m - NEAR_MARGIN ? "near" : "below";
        return { s, t, m, status };
      })
      .sort((a, b) => (b.m ?? -1) - (a.m ?? -1));
  }, [items, chosen, serie, calc]);

  return (
    <section className="container-page max-w-4xl py-12">
      <h1 className="section-title mb-3">حاسبة المعدل الاسترشادية</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">أدخل علاماتك لمقارنتها بعتبات التخصصات. هذه النسخة لا تطبق معاملات التوجيه الرسمية.</p>
      {hasDemo(items) && <DemoNotice />}

      <div className="card grid gap-5 p-6">
        <label className="font-bold">1. شعبة البكالوريا
          <select className="input mt-2" value={serie} onChange={(e) => setSerie(e.target.value)}>
            {SERIE_NAMES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>

        <div>
          <p className="mb-2 font-bold">2. علاماتك <span className="text-sm font-normal text-slate-500">(اترك الحقل فارغاً إن لم تكن لديك العلامة)</span></p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">{label}
                <input type="text" inputMode="decimal" placeholder="0 - 20" value={marks[key]} aria-invalid={calc.bad.includes(key)}
                  onChange={(e) => setMarks({ ...marks, [key]: e.target.value })}
                  className={`input mt-2 ${calc.bad.includes(key) ? "!border-red-500" : ""}`} />
                {calc.bad.includes(key) && <span className="mt-1 block text-xs text-red-600">أدخل رقماً بين 0 و20</span>}
              </label>
            ))}
          </div>
        </div>

        <label className="font-bold">3. التخصص المراد مقارنته
          <select className="input mt-2" value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">كل التخصصات المناسبة للشعبة</option>
            {items.map((x) => <option value={x.slug} key={x.slug}>{x.nom_ar}</option>)}
          </select>
        </label>

        <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-950" aria-live="polite">
          <p className="text-sm text-blue-800 dark:text-blue-200">{calc.useGeneral ? "المعدل المعتمد في المقارنة (المعدل العام)" : "المتوسط الحسابي للمواد المدخلة"}</p>
          <p className="mt-1 text-4xl font-black text-blue-900 dark:text-blue-100">{calc.score === null ? "—" : `${calc.score.toFixed(2)} / 20`}</p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-2xl font-black">النتائج حسب الشعبة</h2>
      {chosen && !items.find((x) => x.slug === chosen)?.filiere.includes(serie) && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">شعبة {serie} غير مدرجة ضمن الشعب المؤهلة لهذا التخصص في بيانات الدليل.</p>
      )}
      <div className="space-y-3">
        {rows.map(({ s, t, m, status }) => (
          <div key={s.slug} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>{s.nom_ar}</b><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{s.domaine}</p></div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600 dark:text-slate-400">{m !== null ? `العتبة: ${m.toFixed(2)}${t ? ` (${t.annee})` : ""}` : "عتبة غير محددة"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[status].cls}`}>{status === "none" ? (m === null ? "لا عتبة" : "أدخل علاماتك") : STATUS[status].label}</span>
              </div>
            </div>
            {m !== null && calc.score !== null && calc.bad.length === 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="img" aria-label={`معدلك ${calc.score.toFixed(2)} من عتبة ${m.toFixed(2)}`}>
                <div className={`h-full ${STATUS[status].bar}`} style={{ width: `${Math.min(100, (calc.score / m) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات لهذه الشعبة في البيانات الحالية.</p>}
      </div>
    </section>
  );
}
