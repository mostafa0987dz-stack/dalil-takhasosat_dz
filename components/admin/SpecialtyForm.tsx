"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useEffect, useRef, useState } from "react";
import SpecialtyCard from "@/components/SpecialtyCard";
import { saveSpecialty, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

const initialState: FormState = {};
const join = (a?: string[]) => (a ?? []).join("\n");

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold">{label}
      {hint && <span className="mr-2 text-xs font-normal text-slate-500">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const SECTIONS = [["sec-basic", "الأساسيات"], ["sec-content", "الوصف والمحتوى"], ["sec-bac", "الشعب والعتبات"], ["sec-publish", "النشر"]] as const;

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 text-lg font-black"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs text-white" aria-hidden>{n}</span>{children}</h2>;
}

export default function SpecialtyForm({ isNew, initial, domains, series }: { isNew: boolean; initial: any; domains: string[]; series: string[] }) {
  const [state, action] = useActionState(saveSpecialty, initialState);
  const i = initial ?? {};
  const seuils: any[] = i.thresholds ?? [];
  const seuilsText = seuils.map((t) => `${t.serie} | ${t.annee} | ${t.moyenne ?? ""} | ${t.remarque ?? ""}`).join("\n");
  const demo = seuils.length ? seuils.some((t) => t.is_demo) : true;

  // معاينة مباشرة: نقرأ الحقول من النموذج عند كل تغيير
  const ref = useRef<HTMLFormElement>(null);
  const [pv, setPv] = useState<any>({ slug: i.slug ?? "preview", nom_ar: i.nom_ar ?? "", nom_fr: i.nom_fr ?? "", domaine: i.domaine ?? "", description_ar: i.description_ar ?? "", diplome: i.diplome ?? "", duree: i.duree ?? "", seuils: [] });
  function readPreview() {
    const f = ref.current; if (!f) return;
    const fd = new FormData(f);
    const g = (k: string) => String(fd.get(k) ?? "");
    const rows = g("seuils").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]);
    setPv({
      slug: g("slug") || "preview", nom_ar: g("nom_ar"), nom_fr: g("nom_fr"), domaine: g("domaine"), description_ar: g("description_ar"), diplome: g("diplome"), duree: g("duree"),
      seuils: rows.map((p) => ({ serie: p[0], annee: Number(p[1]), moyenne: p[2] ? Number(p[2].replace(",", ".")) : null })).filter((t) => Number.isFinite(t.annee)),
    });
  }
  useEffect(readPreview, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
    <form ref={ref} action={action} onInput={readPreview} onChange={readPreview} className="card grid gap-8 p-6">
      <input type="hidden" name="isNew" value={isNew ? "1" : "0"} />

      <nav aria-label="أقسام النموذج" className="sticky top-0 z-20 -mx-6 -mt-6 flex gap-2 overflow-x-auto rounded-t-3xl border-b border-slate-200/70 bg-white/95 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/95">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="chip">{label}</a>)}
      </nav>

      <section id="sec-basic" className="grid scroll-mt-20 gap-4">
        <SectionTitle n={1}>المعلومات الأساسية</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="المعرّف (slug)" hint="لاتيني صغير، مثل genie-civil. لا يُغيَّر بعد الإنشاء">
            <input name="slug" required dir="ltr" readOnly={!isNew} defaultValue={i.slug} className={`input ${!isNew ? "opacity-60" : ""}`} />
          </Field>
          <Field label="اسم التخصص بالعربية"><input name="nom_ar" required defaultValue={i.nom_ar} className="input" /></Field>
          <Field label="الاسم بالفرنسية"><input name="nom_fr" dir="ltr" defaultValue={i.nom_fr} className="input" /></Field>
          <Field label="المجال">
            <input name="domaine" required list="domains" defaultValue={i.domaine} className="input" />
            <datalist id="domains">{domains.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="الشهادة"><input name="diplome" required defaultValue={i.diplome} className="input" /></Field>
          <Field label="المدة"><input name="duree" required defaultValue={i.duree} className="input" /></Field>
        </div>
      </section>

      <section id="sec-content" className="grid scroll-mt-20 gap-4">
        <SectionTitle n={2}>الوصف والمحتوى</SectionTitle>
        <Field label="الوصف"><textarea name="description_ar" required rows={4} defaultValue={i.description_ar} className="input" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="المهارات" hint="سطر لكل عنصر"><textarea name="competences" rows={5} defaultValue={join(i.competences)} className="input" /></Field>
          <Field label="آفاق التوظيف" hint="سطر لكل عنصر"><textarea name="debouches" rows={5} defaultValue={join(i.debouches)} className="input" /></Field>
          <Field label="الجامعات" hint="سطر لكل جامعة"><textarea name="universites" rows={4} defaultValue={join(i.universites)} className="input" /></Field>
          <Field label="الوسوم" hint="مفصولة بفاصلة"><textarea name="tags" rows={4} defaultValue={(i.tags ?? []).join("، ")} className="input" /></Field>
        </div>
        <details className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-700/70" open={Boolean(i.nom_en || i.description_fr || i.description_en)}>
          <summary className="cursor-pointer text-sm font-bold">المحتوى متعدد اللغات والإثراء (اختياري)</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="الاسم بالإنجليزية"><input name="nom_en" dir="ltr" defaultValue={i.nom_en ?? ""} className="input" /></Field>
            <span />
            <Field label="الوصف بالفرنسية"><textarea name="description_fr" dir="ltr" rows={4} defaultValue={i.description_fr ?? ""} className="input" /></Field>
            <Field label="الوصف بالإنجليزية"><textarea name="description_en" dir="ltr" rows={4} defaultValue={i.description_en ?? ""} className="input" /></Field>
            <Field label="المواد الدراسية" hint="سطر لكل مادة"><textarea name="subjects" rows={4} defaultValue={join(i.subjects)} className="input" /></Field>
            <Field label="مجالات الدراسة" hint="سطر لكل عنصر"><textarea name="study_fields" rows={4} defaultValue={join(i.study_fields)} className="input" /></Field>
          </div>
        </details>
      </section>

      <section id="sec-bac" className="grid scroll-mt-20 gap-4">
        <SectionTitle n={3}>الشعب والعتبات</SectionTitle>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">الشعب المؤهلة</legend>
          <div className="flex flex-wrap gap-3">
            {series.map((s) => (
              <label key={s} className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
                <input type="checkbox" name="filiere" value={s} defaultChecked={(i.filiere ?? []).includes(s)} />{s}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="العتبات" hint="سطر لكل عتبة بالشكل: الشعبة | السنة | المعدل | ملاحظة (المعدل والملاحظة اختياريان)">
          <textarea name="seuils" rows={6} dir="rtl" defaultValue={seuilsText} placeholder={"علوم تجريبية | 2025 | 16.00 | ملاحظة اختيارية"} className="input font-mono text-sm" />
        </Field>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="is_demo" defaultChecked={demo} className="mt-1" />العتبات تجريبية (تُعرض مع تنبيه للزوار). ألغِ التحديد عند إدخال بيانات رسمية موثقة.</label>
      </section>

      <section id="sec-publish" className="grid scroll-mt-20 gap-3">
        <SectionTitle n={4}>النشر</SectionTitle>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={Boolean(i.published)} />منشور (ظاهر للزوار)</label>
        {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      </section>

      <div className="sticky bottom-0 z-20 -mx-6 -mb-6 flex items-center gap-3 rounded-b-3xl border-t border-slate-200/70 bg-white/95 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/95">
        <SubmitButton>حفظ</SubmitButton><Link href="/admin" className="btn-ghost">إلغاء</Link>
      </div>
    </form>
    <aside className="xl:sticky xl:top-20" aria-label="معاينة مباشرة">
      <p className="mb-2 text-sm font-bold text-slate-600 dark:text-slate-400">معاينة مباشرة (بطاقة التخصص)</p>
      <SpecialtyCard item={pv} asPreview />
    </aside>
    </div>
  );
}
