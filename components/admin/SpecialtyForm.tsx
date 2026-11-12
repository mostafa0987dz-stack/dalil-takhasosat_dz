"use client";
import Link from "next/link";
import { useFormState } from "react-dom";
import { saveSpecialty, type FormState } from "@/app/admin/actions";
import { SERIE_NAMES } from "@/lib/constants";
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

export default function SpecialtyForm({ isNew, initial, domains }: { isNew: boolean; initial: any; domains: string[] }) {
  const [state, action] = useFormState(saveSpecialty, initialState);
  const i = initial ?? {};
  const seuils: any[] = i.thresholds ?? [];
  const seuilsText = seuils.map((t) => `${t.serie} | ${t.annee} | ${t.moyenne ?? ""} | ${t.remarque ?? ""}`).join("\n");
  const demo = seuils.length ? seuils.some((t) => t.is_demo) : true;

  return (
    <form action={action} className="card grid gap-5 p-6">
      <input type="hidden" name="isNew" value={isNew ? "1" : "0"} />
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

      <Field label="الوصف"><textarea name="description_ar" required rows={4} defaultValue={i.description_ar} className="input" /></Field>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">الشعب المؤهلة</legend>
        <div className="flex flex-wrap gap-3">
          {SERIE_NAMES.map((s) => (
            <label key={s} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
              <input type="checkbox" name="filiere" value={s} defaultChecked={(i.filiere ?? []).includes(s)} />{s}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="المهارات" hint="سطر لكل عنصر"><textarea name="competences" rows={5} defaultValue={join(i.competences)} className="input" /></Field>
        <Field label="آفاق التوظيف" hint="سطر لكل عنصر"><textarea name="debouches" rows={5} defaultValue={join(i.debouches)} className="input" /></Field>
        <Field label="الجامعات" hint="سطر لكل جامعة"><textarea name="universites" rows={4} defaultValue={join(i.universites)} className="input" /></Field>
        <Field label="الوسوم" hint="مفصولة بفاصلة"><textarea name="tags" rows={4} defaultValue={(i.tags ?? []).join("، ")} className="input" /></Field>
      </div>

      <Field label="العتبات" hint="سطر لكل عتبة بالشكل: الشعبة | السنة | المعدل | ملاحظة (المعدل والملاحظة اختياريان)">
        <textarea name="seuils" rows={6} dir="rtl" defaultValue={seuilsText} placeholder={"علوم تجريبية | 2025 | 16.00 | ملاحظة اختيارية"} className="input font-mono text-sm" />
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_demo" defaultChecked={demo} />العتبات تجريبية (تُعرض مع تنبيه للزوار). ألغِ التحديد عند إدخال بيانات رسمية موثقة.</label>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={Boolean(i.published)} />منشور (ظاهر للزوار)</label>

      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      <div className="flex gap-3"><SubmitButton>حفظ</SubmitButton><Link href="/admin" className="btn-ghost">إلغاء</Link></div>
    </form>
  );
}
