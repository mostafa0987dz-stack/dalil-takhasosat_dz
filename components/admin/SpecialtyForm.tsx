"use client";
import Link from "next/link";
import { useFormState } from "react-dom";
import { saveSpecialty, type FormState } from "@/app/admin/actions";
import { SERIE_NAMES } from "@/lib/constants";
import SubmitButton from "./SubmitButton";
import { Save, X, Info } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const initialState: FormState = {};
const join = (a?: string[]) => (a ?? []).join("\n");

// مكون الحقل بتصميم زجاجي
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
      <div className="mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-500 flex items-center gap-1"><Info size={12}/>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export default function SpecialtyForm({ isNew, initial, domains }: { isNew: boolean; initial: any; domains: string[] }) {
  const [state, action] = useFormState(saveSpecialty, initialState);
  const i = initial ?? {};
  const seuils: any[] = i.thresholds ?? [];
  const seuilsText = seuils.map((t) => `${t.serie} | ${t.annee} | ${t.moyenne ?? ""} | ${t.remarque ?? ""}`).join("\n");
  const demo = seuils.length ? seuils.some((t) => t.is_demo) : true;

  // كلاسات الحقول الموحدة
  const inputClass = "w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-700/50 dark:bg-slate-900/50 dark:focus:bg-slate-900";
  const readOnlyClass = "opacity-60 cursor-not-allowed";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="isNew" value={isNew ? "1" : "0"} />

      {/* القسم 1: المعلومات الأساسية */}
      <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <h2 className="mb-4 text-lg font-bold text-teal-700 dark:text-teal-400">المعلومات الأساسية</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="المعرّف (Slug)" hint="لاتيني ولا يمكن تغييره">
            <input name="slug" required dir="ltr" readOnly={!isNew} defaultValue={i.slug} className={`${inputClass} ${!isNew ? readOnlyClass : ""}`} />
          </Field>
          <Field label="اسم التخصص بالعربية">
            <input name="nom_ar" required defaultValue={i.nom_ar} className={inputClass} />
          </Field>
          <Field label="الاسم بالفرنسية">
            <input name="nom_fr" dir="ltr" defaultValue={i.nom_fr} className={inputClass} />
          </Field>
          <Field label="المجال">
            <input name="domaine" required list="domains" defaultValue={i.domaine} className={inputClass} />
            <datalist id="domains">{domains.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="الشهادة">
            <input name="diplome" required defaultValue={i.diplome} className={inputClass} />
          </Field>
          <Field label="المدة">
            <input name="duree" required defaultValue={i.duree} className={inputClass} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="الوصف">
            <textarea name="description_ar" required rows={4} defaultValue={i.description_ar} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* القسم 2: الشعب المؤهلة */}
      <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <h2 className="mb-4 text-lg font-bold text-teal-700 dark:text-teal-400">الشعب المؤهلة</h2>
        <div className="flex flex-wrap gap-3">
          {SERIE_NAMES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/40 px-4 py-2 text-sm font-medium transition hover:bg-white dark:border-slate-700/50 dark:bg-slate-900/40 dark:hover:bg-slate-900">
              <input type="checkbox" name="filiere" value={s} defaultChecked={(i.filiere ?? []).includes(s)} className="accent-teal-600" />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* القسم 3: التفاصيل (المهارات، الآفاق، إلخ) */}
      <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <h2 className="mb-4 text-lg font-bold text-teal-700 dark:text-teal-400">التفاصيل الإضافية</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="المهارات" hint="سطر لكل عنصر">
            <textarea name="competences" rows={5} defaultValue={join(i.competences)} className={inputClass} />
          </Field>
          <Field label="آفاق التوظيف" hint="سطر لكل عنصر">
            <textarea name="debouches" rows={5} defaultValue={join(i.debouches)} className={inputClass} />
          </Field>
          <Field label="الجامعات" hint="سطر لكل جامعة">
            <textarea name="universites" rows={4} defaultValue={join(i.universites)} className={inputClass} />
          </Field>
          <Field label="الوسوم" hint="مفصولة بفاصلة">
            <textarea name="tags" rows={4} defaultValue={(i.tags ?? []).join("، ")} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* القسم 4: العتبات */}
      <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
        <h2 className="mb-4 text-lg font-bold text-teal-700 dark:text-teal-400">عتبات القبول</h2>
        <Field label="العتبات" hint="سطر لكل عتبة: الشعبة | السنة | المعدل | ملاحظة">
          <textarea name="seuils" rows={6} dir="rtl" defaultValue={seuilsText} placeholder={"علوم تجريبية | 2025 | 16.00 | ملاحظة اختيارية"} className={`${inputClass} font-mono`} />
        </Field>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="is_demo" defaultChecked={demo} className="accent-teal-600" />
            العتبات تجريبية (تُعرض مع تنبيه للزوار)
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-400">
            <input type="checkbox" name="published" defaultChecked={Boolean(i.published)} className="accent-teal-600" />
            منشور (ظاهر للزوار)
          </label>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      )}

      {/* أزرار التحكم */}
      <div className="flex items-center gap-3">
        <SubmitButton>
          <Save size={18} /> حفظ التعديلات
        </SubmitButton>
        <Link href="/admin" className="flex items-center gap-2 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <X size={18} /> إلغاء
        </Link>
      </div>
    </form>
  );
}
