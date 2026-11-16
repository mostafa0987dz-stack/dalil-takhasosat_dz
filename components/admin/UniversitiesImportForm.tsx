"use client";
import { useActionState } from "react";
import { importUniversitiesJson, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

const initial: FormState = {};
const sample = `{
  "universities": [
    {
      "slug": "universite-alger-1",
      "name_ar": "جامعة الجزائر 1",
      "wilaya": "الجزائر",
      "specialties": [
        {
          "specialty_slug": "medecine",
          "rates": [
            { "bac_branch": "علوم تجريبية", "year": 2025, "score": 15.25,
              "source_url": "https://…", "is_official": true }
          ]
        }
      ]
    }
  ]
}`;

export default function UniversitiesImportForm() {
  const [state, action] = useActionState(importUniversitiesJson, initial);
  return (
    <form action={action} className="card grid gap-4 p-6">
      <label className="text-sm font-bold">ملف JSON
        <input type="file" name="file" accept="application/json,.json" className="input mt-2" />
      </label>
      <label className="text-sm font-bold">أو ألصق المحتوى
        <textarea name="json" rows={7} dir="ltr" className="input mt-2 font-mono text-xs" placeholder='{ "universities": [ … ] }' />
      </label>
      <div className="grid gap-2 rounded-2xl bg-slate-100/70 p-4 text-sm dark:bg-slate-800/50">
        <label className="flex items-start gap-2"><input type="checkbox" name="publish" className="mt-1" /><span>نشر كل الجامعات في الملف مباشرة <small className="block text-slate-500">وإلا تُنشر حسب الحقل is_published في الملف، والجديدة بدونه تُحفظ مسودات.</small></span></label>
        <label className="flex items-start gap-2"><input type="checkbox" name="replace" className="mt-1" /><span>استبدال معدلات القبول <small className="block text-slate-500">يحذف المعدلات الحالية للجامعات الموجودة في الملف ثم يضيف ما في الملف فقط. بدونه: تُحدَّث السجلات المتطابقة وتُضاف الجديدة.</small></span></label>
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-7 text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{state.ok}</p>}
      <div><SubmitButton>رفع الجامعات والمعدلات</SubmitButton></div>
      <details className="rounded-2xl border border-slate-200/70 p-4 text-sm dark:border-slate-700/70">
        <summary className="cursor-pointer font-bold">شكل الملف المطلوب</summary>
        <pre dir="ltr" className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-left text-xs leading-6 text-slate-100">{sample}</pre>
        <ul className="mt-3 list-inside list-disc space-y-1 leading-7 text-slate-600 dark:text-slate-400">
          <li><code>specialty_slug</code> يجب أن يكون موجوداً مسبقاً في التخصصات.</li>
          <li><code>bac_branch</code> يطابق اسم شعبة في «إدارة الشعب».</li>
          <li><code>score</code> بين 0 و20 أو <code>null</code> إن لم يتوفر؛ الفاصلة العشرية «15,25» مقبولة.</li>
          <li>سجل «رسمي» (<code>is_official</code>) يتطلب <code>source_url</code>.</li>
          <li>أي خطأ يوقف الاستيراد كاملاً دون حفظ شيء، ويذكر مكان الخطأ.</li>
        </ul>
      </details>
    </form>
  );
}
