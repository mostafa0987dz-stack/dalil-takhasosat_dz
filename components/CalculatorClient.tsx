"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, CircleX, Calculator } from "lucide-react";
import type { Specialty } from "@/types";
import { FORMULAS, specialtyMatchesField, weighted } from "@/lib/formulas";
import { seuilFor } from "@/lib/specialty";

type Status = "ok" | "near" | "low" | "na";
const STATUS: Record<Status, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: "معدلك يفوق العتبة", cls: "text-emerald-700 dark:text-emerald-300", Icon: CheckCircle2 },
  near: { label: "قريب من العتبة", cls: "text-amber-700 dark:text-amber-300", Icon: CircleAlert },
  low: { label: "أقل من العتبة", cls: "text-rose-700 dark:text-rose-300", Icon: CircleX },
  na: { label: "لا توجد عتبة لشعبتك", cls: "text-slate-500", Icon: CircleAlert },
};

export default function CalculatorClient({ items }: { items: Specialty[] }) {
  const params = useSearchParams();
  const preset = items.find((x) => x.slug === params.get("specialty"));
  const series = Object.keys(FORMULAS);

  const [serie, setSerie] = useState(() => (preset?.filiere.find((f) => FORMULAS[f]) ?? series[0]));
  const [field, setField] = useState(() => Object.keys(FORMULAS[preset?.filiere.find((f) => FORMULAS[f]) ?? series[0]])[0]);
  const [chosen, setChosen] = useState(preset?.slug ?? "");
  const [marks, setMarks] = useState<Record<string, string>>({});

  const fields = Object.keys(FORMULAS[serie]);
  const terms = FORMULAS[serie][field] ?? [];
  const avg = useMemo(() => weighted(terms, marks), [terms, marks]);
  const filled = terms.filter((t) => (marks[t.subject] ?? "") !== "").length;

  function changeSerie(s: string) {
    setSerie(s);
    setField(Object.keys(FORMULAS[s])[0]);
    setMarks({});
  }

  const list = useMemo(
    () =>
      items
        .filter((s) => s.filiere.includes(serie) && specialtyMatchesField(s, field) && (!chosen || s.slug === chosen))
        .map((s) => {
          const seuil = seuilFor(s, serie);
          const m = seuil?.moyenne ?? null;
          let status: Status = "na";
          if (m !== null && avg !== null) status = avg >= m ? "ok" : m - avg <= 0.5 ? "near" : "low";
          return { s, m, status, demo: Boolean(seuil?.demo) };
        })
        .sort((a, b) => (b.m ?? 0) - (a.m ?? 0)),
    [items, serie, field, chosen, avg],
  );

  return (
    <section className="container-page max-w-4xl py-12">
      <h1 className="section-title mb-3">حاسبة المعدل الموزون</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">اختر شعبتك والميدان، وأدخل العلامات المطلوبة فقط. تُحسب النتيجة عند اكتمال كل العلامات.</p>

      <div className="card grid gap-5 p-6">
        <label className="font-bold">شعبة البكالوريا
          <select className="input mt-2 font-bold" value={serie} onChange={(e) => changeSerie(e.target.value)}>
            {series.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="font-bold">الميدان المراد التسجيل فيه
          <select className="input mt-2 font-bold" value={field} onChange={(e) => { setField(e.target.value); setMarks({}); }}>
            {fields.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {terms.map((t) => (
            <label key={t.subject} className="flex flex-col font-bold">
              <span className="flex items-center justify-between">
                <span>{t.subject}</span>
                <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">معامل {t.coef}</span>
              </span>
              <input
                type="number" inputMode="decimal" min={0} max={20} step={0.01} placeholder="0 – 20" className="input mt-2"
                value={marks[t.subject] ?? ""} onChange={(e) => setMarks({ ...marks, [t.subject]: e.target.value })}
              />
            </label>
          ))}
        </div>

        <label className="font-bold">تخصص محدد للمقارنة (اختياري)
          <select className="input mt-2" value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">كل التخصصات المناسبة للميدان</option>
            {items.filter((s) => s.filiere.includes(serie)).map((x) => <option value={x.slug} key={x.slug}>{x.nom_ar}</option>)}
          </select>
        </label>

        <div className="rounded-2xl bg-blue-50/80 p-5 dark:bg-blue-950/60" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-200"><Calculator size={16} />المعدل الموزون</p>
          <p className="mt-1 text-4xl font-black text-blue-800 dark:text-blue-100">{avg === null ? "—" : `${avg.toFixed(2)} / 20`}</p>
          {avg === null && filled > 0 && <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">أكمل بقية العلامات (0 – 20) لإظهار النتيجة.</p>}
          <p className="mt-2 text-xs text-slate-500">الصيغة: {terms.map((t) => `${t.subject} × ${t.coef}`).join(" + ")} ÷ {terms.reduce((a, t) => a + t.coef, 0)}</p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-2xl font-black">تخصصات الميدان لشعبتك</h2>
      <div className="space-y-3">
        {list.map(({ s, m, status, demo }) => {
          const { label, cls, Icon } = STATUS[status];
          return (
            <Link key={s.slug} href={`/specialties/${s.slug}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 !p-4">
              <div>
                <b>{s.nom_ar}</b>
                <p className="mt-1 text-xs text-slate-500">{s.domaine}</p>
              </div>
              <div className="text-left text-sm">
                <p className="text-slate-600 dark:text-slate-400">العتبة{demo ? " (تجريبية)" : ""}: <b>{m !== null ? m.toFixed(2) : "غير محددة"}</b></p>
                {avg !== null && <p className={`mt-1 flex items-center justify-end gap-1 font-bold ${cls}`}><Icon size={14} />{label}</p>}
              </div>
            </Link>
          );
        })}
        {!list.length && <p className="py-8 text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات مسجلة لهذا الميدان وهذه الشعبة بعد.</p>}
      </div>
      <p className="mt-6 text-xs leading-6 text-slate-500">النتائج إرشادية؛ الصيغ والعتبات الرسمية تُنشر سنوياً من وزارة التعليم العالي والبحث العلمي.</p>
    </section>
  );
}
